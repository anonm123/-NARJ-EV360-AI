import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Basit veri deposu (geliştirme / demo ortamı için), iki arka uçla:
 *  - Dosya (varsayılan): `.data/narj-db.json`; Vercel'de proje klasörü salt okunur olduğundan `/tmp`.
 *    Vercel'de /tmp kalıcı değildir — kayıtlar sunucu örneği yenilenince silinebilir.
 *  - Upstash Redis (isteğe bağlı, kalıcı): `KV_REST_API_URL` + `KV_REST_API_TOKEN`
 *    (Vercel Storage entegrasyonunun adları) veya `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` tanımlıysa.
 * Üretimde aynı arayüzle PostgreSQL adaptörüne geçilmesi önerilir — bkz. docs/SECURITY.md.
 * Yazmalar süreç içi bir kuyrukla sıralanır; dosya yazımı atomiktir (tmp + rename).
 */

export type Role = 'driver' | 'fleet' | 'operator' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Session {
  id: string; // sha256(token)
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserVehicle {
  id: string;
  userId: string;
  nickname: string;
  profileId: string;
  batteryKwh: number;
  consumptionKwhPer100: number;
  maxDcKw: number;
  plate?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  userId: string | null;
  stationId: string;
  stationName: string;
  date: string;
  slot: string;
  durationMin: number;
  estimatedCost: number;
  status: 'confirmed' | 'cancelled';
  paymentRef: string; // demo referansı — gerçek ödeme yok
  createdAt: string;
}

export interface SavedRoute {
  id: string;
  userId: string;
  fromId: string;
  toId: string;
  label: string;
  distanceKm: number;
  totalMinutes: number;
  totalCost: number;
  stops: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  interest: string;
  message?: string;
  consent: boolean;
  createdAt: string;
}

export interface FleetVehicle {
  id: string;
  userId: string;
  plate: string;
  driver: string;
  profileId: string;
  soc: number;
  status: 'yolda' | 'şarjda' | 'depoda';
  kmToday: number;
}

export interface DB {
  users: User[];
  sessions: Session[];
  vehicles: UserVehicle[];
  reservations: Reservation[];
  routes: SavedRoute[];
  leads: Lead[];
  fleet: FleetVehicle[];
}

const DATA_DIR = process.env.NARJ_DATA_DIR || (process.env.VERCEL ? '/tmp/narj-data' : path.join(process.cwd(), '.data'));
const FILE = path.join(DATA_DIR, 'narj-db.json');

const REDIS_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const REDIS_KEY = process.env.NARJ_REDIS_KEY || 'narj:db';
export const STORAGE_BACKEND: 'redis' | 'file' = REDIS_URL && REDIS_TOKEN ? 'redis' : 'file';

const empty = (): DB => ({ users: [], sessions: [], vehicles: [], reservations: [], routes: [], leads: [], fleet: [] });

/**
 * Next.js sunucu kodunu birden fazla paket (route / action / route handler) içinde yükleyebilir;
 * modül düzeyindeki değişkenler bu nedenle kopyalanabilir. Kuyruk ve önbellek globalThis üzerinde
 * tek örnek olarak tutulur ve her okumada dosyanın mtime değeri kontrol edilir.
 */
type Store = { queue: Promise<unknown>; cache: DB | null; mtimeMs: number };
const g = globalThis as unknown as { __narjStore?: Store };
const store: Store = (g.__narjStore ??= { queue: Promise.resolve(), cache: null, mtimeMs: -1 });

/* ───────────── Upstash Redis REST (bağımlılıksız, fetch ile) ───────────── */
async function redis(command: string[], body?: string): Promise<unknown> {
  const url = `${REDIS_URL}/${command.map(encodeURIComponent).join('/')}`;
  const res = await fetch(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Redis isteği başarısız: HTTP ${res.status}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`Redis hatası: ${json.error}`);
  return json.result;
}

async function loadRedis(): Promise<DB> {
  // Birden fazla sunucu örneği aynı veriyi paylaştığı için her işlemde taze okunur.
  const raw = (await redis(['get', REDIS_KEY])) as string | null;
  store.cache = raw ? { ...empty(), ...(JSON.parse(raw) as Partial<DB>) } : empty();
  return store.cache;
}

async function persistRedis(db: DB) {
  await redis(['set', REDIS_KEY], JSON.stringify(db));
}

/* ───────────── Dosya ───────────── */
async function loadFile(): Promise<DB> {
  let mtimeMs = 0;
  try {
    mtimeMs = (await fs.stat(FILE)).mtimeMs;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  if (store.cache && store.mtimeMs === mtimeMs) return store.cache;
  if (mtimeMs === 0) {
    store.cache = empty();
  } else {
    const raw = await fs.readFile(FILE, 'utf8');
    store.cache = { ...empty(), ...(JSON.parse(raw) as Partial<DB>) };
  }
  store.mtimeMs = mtimeMs;
  return store.cache;
}

async function persistFile(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await fs.rename(tmp, FILE);
  store.mtimeMs = (await fs.stat(FILE)).mtimeMs;
}

const load = () => (STORAGE_BACKEND === 'redis' ? loadRedis() : loadFile());
const persist = (db: DB) => (STORAGE_BACKEND === 'redis' ? persistRedis(db) : persistFile(db));

/** Salt okuma */
export async function read<T>(fn: (db: DB) => T): Promise<T> {
  await store.queue;
  return fn(await load());
}

/** Sıralı yazma işlemi */
export function write<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = store.queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  store.queue = run.catch(() => undefined);
  return run;
}

export const newId = (prefix: string) => `${prefix}_${crypto.randomBytes(9).toString('base64url')}`;
