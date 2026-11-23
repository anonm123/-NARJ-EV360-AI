'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser, hashPassword, rateLimit, requireUser, verifyPassword } from '@/lib/server/auth';
import { newId, read, write, type Role } from '@/lib/server/db';
import { flatten, leadSchema, passwordChangeSchema, profileSchema, reservationSchema, vehicleSchema } from '@/lib/validation';
import { SAMPLE_STATIONS } from '@/lib/data/stations';
import { cityById } from '@/lib/data/cities';
import type { FormState } from './auth';

/* ───────────── Garaj ───────────── */
export async function addVehicleAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) return { errors: flatten(parsed.error), values: raw };
  const count = await read((db) => db.vehicles.filter((v) => v.userId === user.id).length);
  if (count >= 12) return { message: 'Garajınıza en fazla 12 araç ekleyebilirsiniz.' };
  await write((db) => {
    db.vehicles.push({ id: newId('veh'), userId: user.id, ...parsed.data, plate: parsed.data.plate || undefined, createdAt: new Date().toISOString() });
  });
  revalidatePath('/panel/garaj');
  return { ok: true, message: 'Araç garajınıza eklendi.' };
}

export async function deleteVehicleAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get('id') ?? '');
  await write((db) => {
    db.vehicles = db.vehicles.filter((v) => !(v.id === id && v.userId === user.id));
  });
  revalidatePath('/panel/garaj');
}

/* ───────────── Rotalar ───────────── */
const routeSaveSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  distanceKm: z.number().positive().max(5000),
  totalMinutes: z.number().nonnegative().max(10000),
  totalCost: z.number().nonnegative().max(1e6),
  stops: z.number().int().min(0).max(30),
});

export async function saveRouteAction(input: z.infer<typeof routeSaveSchema>): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: 'Rotayı kaydetmek için giriş yapın.' };
  const parsed = routeSaveSchema.safeParse(input);
  if (!parsed.success) return { message: 'Geçersiz rota verisi.' };
  const from = cityById(parsed.data.fromId);
  const to = cityById(parsed.data.toId);
  if (!from || !to) return { message: 'Geçersiz şehir.' };
  await write((db) => {
    const mine = db.routes.filter((r) => r.userId === user.id);
    if (mine.length >= 50) db.routes = db.routes.filter((r) => r.id !== mine[0].id);
    db.routes.push({ id: newId('rte'), userId: user.id, label: `${from.name} → ${to.name}`, ...parsed.data, createdAt: new Date().toISOString() });
  });
  revalidatePath('/panel/rotalar');
  return { ok: true, message: 'Rota panelinize kaydedildi.' };
}

export async function deleteRouteAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get('id') ?? '');
  await write((db) => {
    db.routes = db.routes.filter((r) => !(r.id === id && r.userId === user.id));
  });
  revalidatePath('/panel/rotalar');
}

/* ───────────── Rezervasyon (DEMO ödeme) ───────────── */
export interface ReservationState extends FormState {
  reservation?: { id: string; paymentRef: string; stationName: string; date: string; slot: string; durationMin: number; estimatedCost: number };
}

export async function createReservationAction(_p: ReservationState, fd: FormData): Promise<ReservationState> {
  if (!(await rateLimit('reserve', 20, 10 * 60_000))) return { message: 'Çok fazla istek. Lütfen biraz bekleyin.' };
  const parsed = reservationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: flatten(parsed.error) };
  const station = SAMPLE_STATIONS.find((s) => s.id === parsed.data.stationId);
  if (!station) return { message: 'İstasyon bulunamadı.' };
  const [mm, yy] = parsed.data.expiry.split('/').map(Number);
  const exp = new Date(2000 + yy, mm, 0, 23, 59);
  if (exp.getTime() < Date.now()) return { errors: { expiry: 'Kartın son kullanma tarihi geçmiş.' } };
  const day = new Date(parsed.data.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (day < today || day.getTime() - today.getTime() > 30 * 864e5) return { errors: { date: 'Tarih bugünden itibaren 30 gün içinde olmalı.' } };

  const user = await getCurrentUser();
  // Tahmini maliyet: istasyon gücünün %70'i ile süre boyunca enerji × örnek tarife
  const estimatedCost = Math.round(((station.maxKw * 0.7 * parsed.data.durationMin) / 60) * station.pricePerKwh);
  const reservation = {
    id: newId('rsv'),
    userId: user?.id ?? null,
    stationId: station.id,
    stationName: station.name,
    date: parsed.data.date,
    slot: parsed.data.slot,
    durationMin: parsed.data.durationMin,
    estimatedCost,
    status: 'confirmed' as const,
    paymentRef: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  // Kart bilgileri hiçbir yerde saklanmaz/loglanmaz.
  await write((db) => {
    db.reservations.push(reservation);
  });
  revalidatePath('/panel/rezervasyonlar');
  return { ok: true, reservation };
}

export async function cancelReservationAction(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get('id') ?? '');
  await write((db) => {
    const r = db.reservations.find((x) => x.id === id && x.userId === user.id);
    if (r) r.status = 'cancelled';
  });
  revalidatePath('/panel/rezervasyonlar');
}

/* ───────────── Profil ───────────── */
export async function updateProfileAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: flatten(parsed.error) };
  await write((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) {
      u.name = parsed.data.name;
      u.company = parsed.data.company || undefined;
    }
  });
  revalidatePath('/panel', 'layout');
  return { ok: true, message: 'Profil güncellendi.' };
}

export async function changePasswordAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await rateLimit(`pw:${user.id}`, 5, 15 * 60_000))) return { message: 'Çok fazla deneme. Daha sonra tekrar deneyin.' };
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: flatten(parsed.error) };
  const stored = await read((db) => db.users.find((u) => u.id === user.id)?.passwordHash ?? '');
  if (!(await verifyPassword(parsed.data.current, stored))) return { errors: { current: 'Mevcut parola hatalı.' } };
  const hash = await hashPassword(parsed.data.password);
  await write((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.passwordHash = hash;
    // diğer tüm oturumları kapat
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
  });
  return { ok: true, message: 'Parolanız değiştirildi. Güvenlik için tüm oturumlar kapatıldı; tekrar giriş yapmanız gerekebilir.' };
}

/* ───────────── Erken erişim / iletişim ───────────── */
export async function submitLeadAction(_p: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const values = { name: raw.name ?? '', email: raw.email ?? '', company: raw.company ?? '', interest: raw.interest ?? 'surucu', message: raw.message ?? '' };
  if (raw.website) return { ok: true, message: 'Teşekkürler! Talebiniz alındı.' }; // bot — sessizce yut
  if (!(await rateLimit('lead', 5, 10 * 60_000))) return { message: 'Çok fazla gönderim. Lütfen daha sonra tekrar deneyin.', values };
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { errors: flatten(parsed.error), values };
  const duplicate = await write((db) => {
    if (db.leads.some((l) => l.email === parsed.data.email)) return true;
    db.leads.push({ id: newId('lead'), name: parsed.data.name, email: parsed.data.email, company: parsed.data.company || undefined, interest: parsed.data.interest, message: parsed.data.message || undefined, consent: true, createdAt: new Date().toISOString() });
    return false;
  });
  if (duplicate) return { ok: true, message: 'Bu e-posta adresi zaten erken erişim listesinde. Tekrar kaydetmenize gerek yok.' };
  // E-posta servisi bağlı değil: bildirim gönderildiği iddia edilmez.
  return { ok: true, message: 'Teşekkürler! Talebiniz kaydedildi. Şu an otomatik e-posta gönderimi yok; ekibimiz listeyi inceleyip sizinle iletişime geçecek.' };
}

/* ───────────── Yönetici ───────────── */
export async function setUserRoleAction(fd: FormData) {
  const admin = await requireUser(['admin']);
  const id = String(fd.get('id') ?? '');
  const role = z.enum(['driver', 'fleet', 'operator', 'admin']).safeParse(fd.get('role'));
  if (!role.success || id === admin.id) return;
  await write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (u) u.role = role.data as Role;
  });
  revalidatePath('/panel/yonetim');
}
