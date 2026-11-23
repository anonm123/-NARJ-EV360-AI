import 'server-only';

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
