import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Basit, dosya tabanlı veri deposu (geliştirme / demo ortamı için).
 * Üretimde aynı arayüzle PostgreSQL (ör. Prisma/Drizzle) adaptörüne geçilmesi önerilir — bkz. docs/SECURITY.md.
 * Tüm yazmalar süreç içi bir kuyrukla sıralanır ve atomik (tmp + rename) yapılır.
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

const DATA_DIR = process.env.NARJ_DATA_DIR || path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'narj-db.json');

const empty = (): DB => ({ users: [], sessions: [], vehicles: [], reservations: [], routes: [], leads: [], fleet: [] });

/**
 * Next.js sunucu kodunu birden fazla paket (route / action / route handler) içinde yükleyebilir;
 * modül düzeyindeki değişkenler bu nedenle kopyalanabilir. Kuyruk ve önbellek globalThis üzerinde
 * tek örnek olarak tutulur ve her okumada dosyanın mtime değeri kontrol edilir.
 */
type Store = { queue: Promise<unknown>; cache: DB | null; mtimeMs: number };
const g = globalThis as unknown as { __narjStore?: Store };
const store: Store = (g.__narjStore ??= { queue: Promise.resolve(), cache: null, mtimeMs: -1 });

async function load(): Promise<DB> {
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

async function persist(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await fs.rename(tmp, FILE);
  store.mtimeMs = (await fs.stat(FILE)).mtimeMs;
}

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
