import 'server-only';
import { cached, fetchJson, USER_AGENT, UpstreamError } from './http';
import { normalizeOcm, normalizeOsm, type OcmPoi, type OcmRef, type OsmElement } from './normalize';
import type { BBox, ProviderResult } from './types';

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
const OVERPASS_URL = () => process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

export async function osmStations(b: BBox): Promise<ProviderResult> {
  if (process.env.NARJ_DISABLE_OSM === '1') return { provider: 'osm', ok: false, stations: [], error: 'devre dışı' };
  const key = `osm:${b.south},${b.west},${b.north},${b.east}`;
  try {
    const { value, hit } = await cached(key, 6 * 3600_000, async () => {
      const bb = `${b.south},${b.west},${b.north},${b.east}`;
      const query = `[out:json][timeout:25];(node["amenity"="charging_station"](${bb});way["amenity"="charging_station"](${bb}););out center tags 400;`;
      const res = await fetchJson<{ elements: OsmElement[] }>(OVERPASS_URL(), {
        provider: 'osm',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
        body: new URLSearchParams({ data: query }).toString(),
        timeoutMs: 30_000,
        maxConcurrent: 1, // Overpass kullanım politikası: aynı anda tek sorgu
      });
      const at = new Date().toISOString();
      return res.elements.map((el) => normalizeOsm(el, at)).filter((s) => s !== null);
    });
    return { provider: 'osm', ok: true, stations: value, cached: hit };
  } catch (e) {
    return { provider: 'osm', ok: false, stations: [], error: e instanceof UpstreamError ? e.message : 'Overpass API yanıt vermedi' };
  }
}
