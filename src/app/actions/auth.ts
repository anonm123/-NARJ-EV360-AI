'use server';

import { redirect } from 'next/navigation';
import { createSession, createUser, destroySession, findUserByEmail, rateLimit, verifyPassword } from '@/lib/server/auth';
import { seedDemoData } from '@/lib/server/seed';
import { flatten, loginSchema, registerSchema, type FieldErrors } from '@/lib/validation';

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
}

const DUMMY_HASH = `scrypt$${'A'.repeat(22)}==$${'A'.repeat(86)}==`;

const safeNext =(v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/panel') && !s.startsWith('//') ? s : '/panel';
};

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await seedDemoData();
  const values = { email: String(fd.get('email') ?? '') };
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: flatten(parsed.error), values };
  if (!(await rateLimit(`login:${parsed.data.email}`, 8, 10 * 60_000))) {
    return { message: 'Çok fazla deneme yapıldı. Lütfen 10 dakika sonra tekrar deneyin.', values };
  }
  const user = await findUserByEmail(parsed.data.email);
  // Kullanıcı yoksa da sabit süreli doğrulama yap (kullanıcı adı tahminini zorlaştırır)
  let ok = false;
  if (user) ok = await verifyPassword(parsed.data.password, user.passwordHash);
  else await verifyPassword(parsed.data.password, DUMMY_HASH).catch(() => false);
  if (!user || !ok) return { message: 'E-posta veya parola hatalı.', values };
  await createSession(user.id);
  redirect(safeNext(fd.get('next')));
}

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd) as Record<string, string>;
  const values = { name: raw.name ?? '', email: raw.email ?? '', role: raw.role ?? 'driver', company: raw.company ?? '' };
  if (!(await rateLimit('register', 10, 60 * 60_000))) return { message: 'Çok fazla kayıt denemesi. Daha sonra tekrar deneyin.', values };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: flatten(parsed.error), values };
  try {
    const user = await createUser(parsed.data);
    await createSession(user.id);
  } catch (e) {
    if ((e as Error).message === 'EMAIL_TAKEN') return { errors: { email: 'Bu e-posta ile kayıtlı bir hesap var.' }, values };
    throw e;
  }
  redirect('/panel?hosgeldin=1');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}
