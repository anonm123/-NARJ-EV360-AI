import 'server-only';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { read, write, newId, type Role, type User } from './db';
import { seedDemoData } from './seed';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const SESSION_COOKIE = 'narj_session';
const SESSION_DAYS = 7;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, saltB64, keyB64] = stored.split('$');
  if (alg !== 'scrypt' || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(key, expected);
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await write((db) => {
    // süresi dolmuş oturumları temizle
    const now = Date.now();
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    db.sessions.push({ id: sha256(token), userId, expiresAt: expires.toISOString(), createdAt: new Date().toISOString() });
    const u = db.users.find((x) => x.id === userId);
    if (u) u.lastLoginAt = new Date().toISOString();
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const id = sha256(token);
    await write((db) => {
      db.sessions = db.sessions.filter((s) => s.id !== id);
    });
  }
  jar.delete(SESSION_COOKIE);
}

export type PublicUser = Omit<User, 'passwordHash'>;
const toPublic = ({ passwordHash: _ph, ...u }: User): PublicUser => u;

export async function getCurrentUser(): Promise<PublicUser | null> {
  await seedDemoData();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  return read((db) => {
    const s = db.sessions.find((x) => x.id === id);
    if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
    const u = db.users.find((x) => x.id === s.userId);
    return u ? toPublic(u) : null;
  });
}

export async function requireUser(roles?: Role[]): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/giris');
  if (roles && !roles.includes(user.role)) redirect('/panel?yetki=yok');
  return user;
}

export async function findUserByEmail(email: string) {
  const e = email.trim().toLowerCase();
  return read((db) => db.users.find((u) => u.email === e) ?? null);
}

export async function createUser(data: { email: string; name: string; password: string; role: Role; company?: string }) {
  const passwordHash = await hashPassword(data.password);
  const email = data.email.trim().toLowerCase();
  return write((db) => {
    if (db.users.some((u) => u.email === email)) throw new Error('EMAIL_TAKEN');
    const user: User = { id: newId('usr'), email, name: data.name.trim(), role: data.role, company: data.company?.trim() || undefined, passwordHash, createdAt: new Date().toISOString() };
    db.users.push(user);
    return toPublic(user);
  });
}

/* ---------------- basit hız sınırlayıcı (süreç içi) ---------------- */
const gb = globalThis as unknown as { __narjBuckets?: Map<string, { count: number; reset: number }> };
const buckets = (gb.__narjBuckets ??= new Map());
export async function rateLimit(key: string, max: number, windowMs: number) {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'local';
  const k = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    buckets.set(k, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= max;
}
