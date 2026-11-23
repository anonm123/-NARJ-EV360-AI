'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { rateLimit, requireUser, type PublicUser } from '@/lib/server/auth';
import { write, newId, type AuditEntry, type DB, type Role } from '@/lib/server/db';
import { keepsAnAdmin } from '@/lib/admin';

function audit(db: DB, actor: PublicUser, action: AuditEntry['action'], target: string, detail?: string) {
  db.audit.push({ id: newId('aud'), at: new Date().toISOString(), actorId: actor.id, actorEmail: actor.email, action, target, detail });
  if (db.audit.length > 2000) db.audit.splice(0, db.audit.length - 2000);
}

const back = (id: string, m: string): never => redirect(`/panel/yonetim/kullanicilar/${encodeURIComponent(id)}?m=${m}`);

/* ───────────── İlk yönetici kurulumu ─────────────
 * Üretimde demo yönetici hesabı kapalıdır. Site sahibi Render → Environment'a uzun, rastgele bir
 * NARJ_ADMIN_SETUP_CODE ekler; kendi hesabıyla giriş yapıp /panel/yonetici-kurulum sayfasına bu kodu girer.
 * (E-posta doğrulaması olmadığından "şu e-posta yönetici olsun" kuralı güvenli değildir.)
 */
export type SetupState = { message?: string };
export async function adminSetupAction(_prev: SetupState, fd: FormData): Promise<SetupState> {
  const user = await requireUser();
  const expected = process.env.NARJ_ADMIN_SETUP_CODE ?? '';
  if (expected.length < 16) return { message: 'Kurulum kodu sunucuda tanımlı değil (en az 16 karakter olmalı).' };
  if (!(await rateLimit('admin-setup', 5, 15 * 60_000))) return { message: 'Çok fazla deneme. 15 dakika sonra tekrar deneyin.' };
  const given = String(fd.get('code') ?? '');
  const h = (s: string) => crypto.createHash('sha256').update(s).digest();
  if (!crypto.timingSafeEqual(h(given), h(expected))) return { message: 'Kod hatalı.' };
  await write((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.role = 'admin';
    audit(db, user, 'admin_setup', user.email, 'kurulum koduyla yönetici yapıldı');
  });
  redirect('/panel/yonetim?m=setup');
}

/* ───────────── Kullanıcı işlemleri ───────────── */
const idSchema = z.string().min(3).max(64);

export async function setUserRoleAction(fd: FormData) {
  const admin = await requireUser(['admin']);
  const id = idSchema.parse(fd.get('id'));
  const role = z.enum(['driver', 'fleet', 'operator', 'admin']).parse(fd.get('role')) as Role;
  if (id === admin.id) back(id, 'self');
  const res = await write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return 'notfound';
    if (u.role === role) return 'same';
    if (!keepsAnAdmin(db.users, id, { role })) return 'lastadmin';
    audit(db, admin, 'role', u.email, `${u.role} → ${role}`);
    u.role = role;
    return 'role';
  });
  revalidatePath('/panel/yonetim', 'layout');
  back(id, res);
}

export async function setUserStatusAction(fd: FormData) {
  const admin = await requireUser(['admin']);
  const id = idSchema.parse(fd.get('id'));
  const op = z.enum(['suspend', 'activate']).parse(fd.get('op'));
  if (id === admin.id) back(id, 'self');
  const res = await write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return 'notfound';
    if (op === 'suspend') {
      if (!keepsAnAdmin(db.users, id, { disable: true })) return 'lastadmin';
      u.disabledAt = new Date().toISOString();
      db.sessions = db.sessions.filter((s) => s.userId !== id); // açık oturumları hemen kapat
      audit(db, admin, 'suspend', u.email);
      return 'suspended';
    }
    delete u.disabledAt;
    audit(db, admin, 'activate', u.email);
    return 'activated';
  });
  revalidatePath('/panel/yonetim', 'layout');
  back(id, res);
}

export async function revokeSessionsAction(fd: FormData) {
  const admin = await requireUser(['admin']);
  const id = idSchema.parse(fd.get('id'));
  if (id === admin.id) back(id, 'self');
  const res = await write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return 'notfound';
    const n = db.sessions.filter((s) => s.userId === id).length;
    db.sessions = db.sessions.filter((s) => s.userId !== id);
    audit(db, admin, 'sessions_revoked', u.email, `${n} oturum`);
    return 'revoked';
  });
  revalidatePath('/panel/yonetim', 'layout');
  back(id, res);
}

/** Kalıcı silme (KVKK silme talebi vb.). Onay için kullanıcının e-postası yazılmalıdır. */
export async function deleteUserAction(fd: FormData) {
  const admin = await requireUser(['admin']);
  const id = idSchema.parse(fd.get('id'));
  const confirm = String(fd.get('confirm') ?? '').trim().toLowerCase();
  if (id === admin.id) back(id, 'self');
  const res = await write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (!u) return 'notfound';
    if (confirm !== u.email) return 'confirm';
    if (!keepsAnAdmin(db.users, id, { remove: true })) return 'lastadmin';
    db.users = db.users.filter((x) => x.id !== id);
    db.sessions = db.sessions.filter((s) => s.userId !== id);
    db.vehicles = db.vehicles.filter((v) => v.userId !== id);
    db.routes = db.routes.filter((r) => r.userId !== id);
    db.fleet = db.fleet.filter((f) => f.userId !== id);
    for (const r of db.reservations) if (r.userId === id) r.userId = null; // demo kayıtları anonimleşir
    audit(db, admin, 'user_deleted', u.email);
    return 'deleted';
  });
  revalidatePath('/panel/yonetim', 'layout');
  if (res === 'deleted') redirect('/panel/yonetim/kullanicilar?m=deleted');
  back(id, res);
}

export async function deleteLeadAction(fd: FormData) {
  const admin = await requireUser(['admin']);
  const id = idSchema.parse(fd.get('id'));
  await write((db) => {
    const l = db.leads.find((x) => x.id === id);
    if (!l) return;
    db.leads = db.leads.filter((x) => x.id !== id);
    audit(db, admin, 'lead_deleted', l.email);
  });
  revalidatePath('/panel/yonetim', 'layout');
  redirect('/panel/yonetim/talepler?m=deleted');
}
