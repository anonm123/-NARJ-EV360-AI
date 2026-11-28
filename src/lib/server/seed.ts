import 'server-only';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { write, newId, type FleetVehicle } from './db';
import { VEHICLE_PROFILES } from '../data/vehicles';

/**
 * Demo hesapları yalnızca geliştirme ortamında veya NARJ_SEED_DEMO=1 iken oluşturulur.
 * Üretimde (NODE_ENV=production) varsayılan olarak KAPALIDIR.
 */
export const DEMO_PASSWORD = 'NarjDemo!2026';
export const DEMO_ACCOUNTS = [
  { email: 'surucu@narj.dev', name: 'Demo Sürücü', role: 'driver' as const },
  { email: 'filo@narj.dev', name: 'Demo Filo Yöneticisi', role: 'fleet' as const, company: 'Örnek Lojistik A.Ş. (demo)' },
  { email: 'admin@narj.dev', name: 'Platform Yöneticisi', role: 'admin' as const },
];

export const seedEnabled = () => process.env.NARJ_SEED_DEMO === '1' || process.env.NODE_ENV !== 'production';

/**
 * Demo yönetici hesabının parolası belgelerde açık olduğundan, herkese açık bir üretim sitesinde
 * kayıtlı kullanıcıların e-postalarını gösterebilir. Bu yüzden üretimde yalnızca
 * NARJ_SEED_DEMO_ADMIN=1 ile açılır (CI'daki geçici test sunucusu gibi).
 */
export const demoAdminEnabled = () => process.env.NODE_ENV !== 'production' || process.env.NARJ_SEED_DEMO_ADMIN === '1';
export const demoAccounts = () => DEMO_ACCOUNTS.filter((a) => a.role !== 'admin' || demoAdminEnabled());

const gs = globalThis as unknown as { __narjSeed?: Promise<void> };
const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

async function hash(pw: string) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export function seedDemoData() {
  if (!seedEnabled()) return Promise.resolve();
  gs.__narjSeed ??= (async () => {
    const hashed = await hash(DEMO_PASSWORD);
    await write((db) => {
      for (const a of demoAccounts()) {
        if (db.users.some((u) => u.email === a.email)) continue;
        const id = newId('usr');
        db.users.push({ id, ...a, passwordHash: hashed, createdAt: new Date().toISOString() });
        if (a.role === 'driver') {
          db.vehicles.push({ id: newId('veh'), userId: id, nickname: 'Günlük aracım', profileId: 't10x-v1-rwd-long', batteryKwh: 89.6, consumptionKwhPer100: 19.7, maxDcKw: 180, plate: '34 NRJ 360', createdAt: new Date().toISOString() });
        }
        if (a.role === 'fleet') {
          const drivers = ['A. Yılmaz', 'B. Kaya', 'C. Demir', 'D. Şahin', 'E. Çelik', 'F. Aydın', 'G. Arslan', 'H. Koç'];
          const statuses: FleetVehicle['status'][] = ['yolda', 'şarjda', 'depoda'];
          drivers.forEach((d, i) => {
            db.fleet.push({
              id: newId('flt'),
              userId: id,
              plate: `34 NJ ${100 + i * 7}`,
              driver: d,
              profileId: i % 3 === 0 ? 't10x-v1-rwd-std' : i % 3 === 1 ? 't10x-v1-rwd-long' : 't10f-v2-rwd-long',
              soc: [82, 34, 67, 18, 91, 55, 46, 73][i],
              status: statuses[i % 3],
              kmToday: [142, 88, 0, 196, 64, 121, 0, 77][i],
            });
          });
        }
      }
    });
  })();
  return gs.__narjSeed;
}

export { VEHICLE_PROFILES };
