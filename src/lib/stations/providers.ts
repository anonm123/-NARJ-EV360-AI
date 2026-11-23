import 'server-only';
import { cached, fetchJson, USER_AGENT, UpstreamError } from './http';
import { epdkRows, normalizeEpdk, normalizeOcm, normalizeOsm, type EpdkResponse, type OcmPoi, type OcmRef, type OsmElement } from './normalize';
import type { BBox, ProviderResult, Station } from './types';

/* ───────────── Open Charge Map — https://api.openchargemap.io/v3 ───────────── */
const OCM_BASE = 'https://api.openchargemap.io/v3';
export const ocmConfigured = () => !!process.env.OPENCHARGEMAP_API_KEY;

function ocmHeaders() {
  return { 'X-API-Key': process.env.OPENCHARGEMAP_API_KEY ?? '', 'User-Agent': USER_AGENT, Accept: 'application/json' };
}

async function ocmReference() {
  // Referans veriler (soket tipleri, operatörler, durumlar, veri sağlayıcıları ve lisansları) 24 saat önbellekte
  return (await cached('ocm:ref', 24 * 3600_000, () => fetchJson<OcmRef>(`${OCM_BASE}/referencedata/`, { provider: 'ocm', headers: ocmHeaders(), timeoutMs: 20_000 }))).value;
}

export async function ocmStations(b: BBox): Promise<ProviderResult> {
  if (!ocmConfigured()) return { provider: 'ocm', ok: false, stations: [], error: 'OPENCHARGEMAP_API_KEY tanımlı değil' };
  const key = `ocm:${b.south},${b.west},${b.north},${b.east}`;
  try {
    const { value, hit } = await cached(key, 60 * 60_000, async () => {
      const ref = await ocmReference();
      const q = new URLSearchParams({
        output: 'json',
        countrycode: 'TR',
        boundingbox: `(${b.north},${b.west}),(${b.south},${b.east})`,
        maxresults: '300',
        compact: 'true',
        verbose: 'false',
        opendata: 'true',
      });
      const pois = await fetchJson<OcmPoi[]>(`${OCM_BASE}/poi/?${q}`, { provider: 'ocm', headers: ocmHeaders() });
      const at = new Date().toISOString();
      return pois.map((p) => normalizeOcm(p, ref, at)).filter((s) => s !== null);
    });
    return { provider: 'ocm', ok: true, stations: value, cached: hit };
  } catch (e) {
    return { provider: 'ocm', ok: false, stations: [], error: e instanceof UpstreamError ? e.message : 'Open Charge Map yanıt vermedi' };
  }
}

/* ───────────── OpenStreetMap — Overpass API (düşük hacim, önbellekli) ───────────── */
/** OVERPASS_URL virgülle ayrılmış birden fazla sunucu alabilir; sırayla denenir (yalnızca izinli/kamuya açık örnekler yazılmalı). */
const OVERPASS_URLS = () => (process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter').split(',').map((u) => u.trim()).filter(Boolean);

export async function osmStations(b: BBox): Promise<ProviderResult> {
  if (process.env.NARJ_DISABLE_OSM === '1') return { provider: 'osm', ok: false, stations: [], error: 'devre dışı' };
  const key = `osm:${b.south},${b.west},${b.north},${b.east}`;
  try {
    const { value, hit } = await cached(key, 6 * 3600_000, async () => {
      const bb = `${b.south},${b.west},${b.north},${b.east}`;
      const query = `[out:json][timeout:25];(node["amenity"="charging_station"](${bb});way["amenity"="charging_station"](${bb}););out center tags 400;`;
      let lastErr: unknown;
      for (const url of OVERPASS_URLS()) {
        try {
          const res = await fetchJson<{ elements: OsmElement[] }>(url, {
            provider: 'osm',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
            body: new URLSearchParams({ data: query }).toString(),
            timeoutMs: 30_000,
            maxConcurrent: 1, // Overpass kullanım politikası: aynı anda tek sorgu
          });
          const at = new Date().toISOString();
          return res.elements.map((el) => normalizeOsm(el, at)).filter((s) => s !== null);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    });
    return { provider: 'osm', ok: true, stations: value, cached: hit };
  } catch (e) {
    return { provider: 'osm', ok: false, stations: [], error: e instanceof UpstreamError ? e.message : 'Overpass API yanıt vermedi' };
  }
}

/* ───────────── EPDK — Şarj İstasyonları REST Web Servisi ─────────────
 * Kılavuza göre parametresiz (tüm liste) sorgu saatte en fazla 1 kez yapılabilir. Bu yüzden:
 *  - tüm liste tek istekle alınır, 6 saat bellekte tutulur ve bbox filtresi yerelde uygulanır;
 *  - aynı anda gelen istekler tek bir indirmeyi paylaşır;
 *  - başarısız denemeden sonra 60 dk yeni istek yapılmaz (son başarılı veri varsa o sunulur).
 */
const EPDK_URL = () => process.env.EPDK_SARJ_URL || 'https://apigateway.epdk.gov.tr/sarjIstasyonlari';
const EPDK_TTL = 6 * 3600_000;
const EPDK_MIN_INTERVAL = 60 * 60_000;

type EpdkState = { stations: Station[] | null; fetchedAt: number; lastAttempt: number; lastError: string | null; inflight: Promise<void> | null };
const ge = globalThis as unknown as { __narjEpdk?: EpdkState };
const epdk: EpdkState = (ge.__narjEpdk ??= { stations: null, fetchedAt: 0, lastAttempt: 0, lastError: null, inflight: null });

async function refreshEpdk() {
  epdk.lastAttempt = Date.now();
  try {
    const res = await fetchJson<EpdkResponse>(EPDK_URL(), {
      provider: 'epdk',
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      timeoutMs: 90_000, // tüm liste ~13 MB
      retries: 0, // saatlik sınır: otomatik yeniden deneme yok
      maxConcurrent: 1,
    });
    if (res.statusCode != null && res.statusCode !== 200) throw new UpstreamError(`epdk statusCode ${res.statusCode}${res.message ? `: ${res.message}` : ''}`);
    const at = new Date().toISOString();
    const list = epdkRows(res).map((r) => normalizeEpdk(r, at)).filter((x): x is Station => x !== null);
    if (list.length === 0) throw new UpstreamError('EPDK yanıtında koordinatlı istasyon yok');
    epdk.stations = list;
    epdk.fetchedAt = Date.now();
    epdk.lastError = null;
  } catch (e) {
    epdk.lastError = e instanceof UpstreamError ? e.message : 'EPDK web servisi yanıt vermedi';
  }
}

export async function epdkStations(b: BBox): Promise<ProviderResult> {
  if (process.env.NARJ_DISABLE_EPDK === '1') return { provider: 'epdk', ok: false, stations: [], error: 'devre dışı' };
  const now = Date.now();
  const fresh = epdk.stations && now - epdk.fetchedAt < EPDK_TTL;
  let hit = true;
  if (!fresh && now - epdk.lastAttempt >= EPDK_MIN_INTERVAL) {
    hit = false;
    epdk.inflight ??= refreshEpdk().finally(() => (epdk.inflight = null));
  }
  if (epdk.inflight) {
    hit = false;
    // İlk indirme uzun sürebilir; isteği en fazla 15 sn bekletip arka planda sürdürürüz.
    const done = await Promise.race([epdk.inflight.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), 15_000))]);
    if (!done && !epdk.stations) return { provider: 'epdk', ok: false, stations: [], error: 'EPDK listesi indiriliyor; birkaç saniye sonra yeniden deneyin' };
  }
  if (!epdk.stations) {
    const wait = Math.max(0, Math.ceil((EPDK_MIN_INTERVAL - (Date.now() - epdk.lastAttempt)) / 60_000));
    return { provider: 'epdk', ok: false, stations: [], error: `${epdk.lastError ?? 'veri yok'}${wait ? ` · saatlik sorgu sınırı nedeniyle ${wait} dk sonra yeniden denenecek` : ''}` };
  }
  const inside = epdk.stations.filter((s) => s.lat >= b.south && s.lat <= b.north && s.lng >= b.west && s.lng <= b.east);
  const stale = Date.now() - epdk.fetchedAt >= EPDK_TTL;
  return { provider: 'epdk', ok: true, stations: inside, cached: hit, ...(stale && epdk.lastError ? { error: `eski veri (${new Date(epdk.fetchedAt).toISOString()}); yenileme başarısız: ${epdk.lastError}` } : {}) };
}
