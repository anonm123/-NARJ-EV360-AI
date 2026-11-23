import 'server-only';
import { mergeStations } from './normalize';
import { epdkStations, ocmStations, osmStations, ocmConfigured } from './providers';
import type { BBox, ProviderResult, Station } from './types';

/** Sorgu alanı sınırı: geniş alanlarda kaynaklara toplu yük bindirmemek için. */
export const MAX_SPAN_DEG = 1.0;

/** BBox'ı 0,25°'lik ızgaraya dışa doğru oturtur; aynı bölgedeki sorgular aynı önbellek anahtarını kullanır. */
export function snapBBox(b: BBox): BBox {
  const s = 0.25;
  const r = (v: number) => Math.round(v * 1000) / 1000;
  return { south: r(Math.floor(b.south / s) * s), west: r(Math.floor(b.west / s) * s), north: r(Math.ceil(b.north / s) * s), east: r(Math.ceil(b.east / s) * s) };
}

export function validBBox(b: BBox) {
  return [b.south, b.west, b.north, b.east].every(Number.isFinite) && b.south < b.north && b.west < b.east && b.south >= 35 && b.north <= 42.5 && b.west >= 25 && b.east <= 45.5;
}

export async function searchStations(bbox: BBox): Promise<{ stations: Station[]; providers: Omit<ProviderResult, 'stations'>[] }> {
  const b = snapBBox(bbox);
  const [epdk, ocm, osm] = await Promise.all([epdkStations(b), ocmStations(b), osmStations(b)]);
  const inside = (s: Station) => s.lat >= bbox.south && s.lat <= bbox.north && s.lng >= bbox.west && s.lng <= bbox.east;
  // Öncelik: EPDK (resmî lisans kaydı) → OCM (soket ayrıntısı) → OSM (topluluk verisi)
  const stations = mergeStations(mergeStations(epdk.stations, ocm.stations), osm.stations).filter(inside);
  const meta = (r: ProviderResult) => ({ provider: r.provider, ok: r.ok, error: r.error, cached: r.cached, count: r.stations.filter(inside).length });
  return { stations, providers: [meta(epdk), meta(ocm), meta(osm)] };
}

export { ocmConfigured };
export type { Station, BBox };
