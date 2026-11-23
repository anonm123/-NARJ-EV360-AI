import 'server-only';
import { cumulativeKm, projectOnRoute, simplify, type LngLat } from '../routing/geometry';
import { mergeStations } from './normalize';
import { epdkStations, ocmStations, osmCorridor } from './providers';
import { snapBBox } from './index';
import type { BBox, ProviderResult, Station } from './types';

export interface CorridorStation extends Station {
  routeKm: number;
  offRouteKm: number;
}

/**
 * Rota boyunca (koridor genişliği `radiusKm`) tüm kaynaklardan istasyonları tek seferde toplar:
 *  - EPDK: bellekteki resmî liste rota çerçevesine göre süzülür (ek istek yok);
 *  - OSM: tek Overpass `around` sorgusu;
 *  - OCM (anahtar varsa): rota ≤ 0,5°'lik parçalara bölünüp bölge sorguları (önbellekli).
 * Her istasyon rotaya izdüşürülür; koridor dışındakiler atılır.
 */
export async function corridorStations(geometry: LngLat[], distanceKm: number, radiusKm = 5) {
  const cum = cumulativeKm(geometry, distanceKm);
  const pad = radiusKm / 100 + 0.02;
  const lats = geometry.map((c) => c[1]), lngs = geometry.map((c) => c[0]);
  const box: BBox = { south: Math.min(...lats) - pad, north: Math.max(...lats) + pad, west: Math.min(...lngs) - pad, east: Math.max(...lngs) + pad };

  // OCM: rotayı yaklaşık 0,5°'lik parçalara böl
  const chunks: BBox[] = [];
  let start = 0;
  for (let i = 1; i < geometry.length; i++) {
    const seg = geometry.slice(start, i + 1);
    const la = seg.map((c) => c[1]), ln = seg.map((c) => c[0]);
    if (Math.max(...la) - Math.min(...la) > 0.5 || Math.max(...ln) - Math.min(...ln) > 0.5 || i === geometry.length - 1) {
      chunks.push(snapBBox({ south: Math.min(...la) - pad, north: Math.max(...la) + pad, west: Math.min(...ln) - pad, east: Math.max(...ln) + pad }));
      start = i;
    }
  }
  const line = simplify(geometry, 0.01).slice(0, 400) as [number, number][];

  const [epdk, osm, ocmParts] = await Promise.all([
    epdkStations(box),
    osmCorridor(line, Math.round(radiusKm * 1000)),
    Promise.all(chunks.map((b) => ocmStations(b))),
  ]);
  const ocm: ProviderResult = ocmParts.every((r) => r.ok)
    ? { provider: 'ocm', ok: true, stations: dedupe(ocmParts.flatMap((r) => r.stations)), cached: ocmParts.every((r) => r.cached) }
    : { provider: 'ocm', ok: false, stations: dedupe(ocmParts.flatMap((r) => r.stations)), error: ocmParts.find((r) => !r.ok)?.error };

  const merged = mergeStations(mergeStations(epdk.stations, ocm.stations), osm.stations);
  const along: CorridorStation[] = [];
  for (const s of merged) {
    if (s.lat < box.south || s.lat > box.north || s.lng < box.west || s.lng > box.east) continue;
    const pr = projectOnRoute(geometry, cum, [s.lng, s.lat]);
    if (pr.offKm <= radiusKm) along.push({ ...s, routeKm: pr.km, offRouteKm: pr.offKm });
  }
  along.sort((a, b) => a.routeKm - b.routeKm);
  const meta = (r: ProviderResult) => ({ provider: r.provider, ok: r.ok, error: r.error, cached: r.cached, count: along.filter((s) => s.sources.some((x) => x.provider === r.provider)).length });
  return { stations: along, providers: [meta(epdk), meta(ocm), meta(osm)] };
}

function dedupe(list: Station[]) {
  const m = new Map<string, Station>();
  for (const s of list) m.set(s.id, s);
  return [...m.values()];
}
