import 'server-only';
import https from 'node:https';

/**
 * Dış API çağrıları için ortak yardımcılar: zaman aşımı, sınırlı yeniden deneme,
 * sağlayıcı başına eşzamanlılık sınırı ve TTL önbelleği.
 */
export class UpstreamError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

const limiters = new Map<string, { active: number; queue: (() => void)[] }>();

async function withLimit<T>(key: string, max: number, fn: () => Promise<T>): Promise<T> {
  const l = limiters.get(key) ?? { active: 0, queue: [] };
  limiters.set(key, l);
  if (l.active >= max) await new Promise<void>((r) => l.queue.push(r));
  l.active++;
  try {
    return await fn();
  } finally {
    l.active--;
    l.queue.shift()?.();
  }
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { provider: string; timeoutMs?: number; retries?: number; maxConcurrent?: number } ,
): Promise<T> {
  const { provider, timeoutMs = 12_000, retries = 1, maxConcurrent = 2, ...rest } = init;
  return withLimit(provider, maxConcurrent, async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...rest, signal: ctrl.signal, cache: 'no-store' });
        if (res.status === 429 || res.status >= 500) throw new UpstreamError(`${provider} HTTP ${res.status}`, res.status);
        if (!res.ok) {
          // 4xx: yeniden denemenin anlamı yok
          const body = (await res.text()).slice(0, 200);
          throw Object.assign(new UpstreamError(`${provider} HTTP ${res.status}: ${body}`, res.status), { final: true });
        }
        return (await res.json()) as T;
      } catch (e) {
        lastErr = e;
        if ((e as { final?: boolean }).final) break;
        if (attempt < retries) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr instanceof Error ? lastErr : new UpstreamError(String(lastErr));
  });
}

/**
 * GET + JSON gövde. Bazı resmî servisler (EPDK API Gateway) GET isteğinde JSON gövde şartı koşar;
 * WHATWG fetch GET'te gövdeye izin vermediği için node:https kullanılır. Yanıt boyutu sınırlıdır.
 */
export function getJsonWithBody<T>(url: string, body: unknown, opts: { provider: string; timeoutMs?: number; maxBytes?: number; headers?: Record<string, string> }): Promise<T> {
  const { provider, timeoutMs = 60_000, maxBytes = 64 * 1024 * 1024, headers = {} } = opts;
  const payload = Buffer.from(JSON.stringify(body));
  return withLimit(provider, 1, () =>
    new Promise<T>((resolve, reject) => {
      const req = https.request(url, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Content-Length': String(payload.length), Accept: 'application/json', ...headers } }, (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) {
            req.destroy(new UpstreamError(`${provider} yanıtı çok büyük`));
            return;
          }
          chunks.push(c);
        });
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 0;
          if (status < 200 || status >= 300) return reject(new UpstreamError(`${provider} HTTP ${status}: ${text.slice(0, 200)}`, status));
          try {
            resolve(JSON.parse(text) as T);
          } catch {
            reject(new UpstreamError(`${provider} geçersiz JSON`));
          }
        });
        res.on('error', reject);
      });
      req.setTimeout(timeoutMs, () => req.destroy(new UpstreamError(`${provider} zaman aşımı`)));
      req.on('error', (e) => reject(e instanceof UpstreamError ? e : new UpstreamError(`${provider} bağlantı hatası: ${(e as Error).message}`)));
      req.end(payload);
    }),
  );
}

/* ───────── TTL önbellek (süreç içi; globalThis ile paket kopyalarına karşı tek örnek) ───────── */
type Entry = { value: unknown; expires: number };
const g = globalThis as unknown as { __narjCache?: Map<string, Entry> };
const cache = (g.__narjCache ??= new Map());

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<{ value: T; hit: boolean }> {
  const now = Date.now();
  const e = cache.get(key);
  if (e && e.expires > now) return { value: e.value as T, hit: true };
  const value = await fn();
  cache.set(key, { value, expires: now + ttlMs });
  if (cache.size > 500) {
    for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
    if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  }
  return { value, hit: false };
}

export const USER_AGENT = 'NAR-J-EV360-AI/0.1 (+https://github.com/anonm123/-NARJ-EV360-AI)';
