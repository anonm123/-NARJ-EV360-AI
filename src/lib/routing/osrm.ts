import 'server-only';
import { cached, fetchJson, USER_AGENT, UpstreamError } from '../stations/http';
import { simplify, type LngLat } from './geometry';

/**
 * OSRM (açık kaynak) karayolu rotası. Varsayılan sunucu OSRM'nin herkese açık DEMO sunucusudur
 * (router.project-osrm.org) — üretim için kendi OSRM/Valhalla/GraphHopper kurulumunuzu OSRM_URL ile verin.
 */
export const OSRM_URL = () => (process.env.OSRM_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
export const osrmIsDemoServer = () => !process.env.OSRM_URL;

export interface RoadRoute {
  distanceKm: number;
  durationMin: number;
  geometry: LngLat[];
  engine: string;
  demoServer: boolean;
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: { distance: number; duration: number; geometry: { coordinates: LngLat[] } }[];
}

export class RouteNotFound extends Error {}

export async function roadRoute(points: LngLat[]): Promise<RoadRoute> {
  const coords = points.map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
  const url = `${OSRM_URL()}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&alternatives=false`;
  const { value } = await cached(`osrm:${coords}`, 6 * 3600_000, async () => {
    let res: OsrmResponse;
    try {
      res = await fetchJson<OsrmResponse>(url, { provider: 'osrm', headers: { 'User-Agent': USER_AGENT }, timeoutMs: 20_000 });
    } catch (e) {
      // OSRM "NoRoute" vb. durumlarda 400 döner
      if (e instanceof UpstreamError && e.status === 400) throw new RouteNotFound('Bu noktalar arasında karayolu rotası bulunamadı.');
      throw e;
    }
    if (res.code !== 'Ok' || !res.routes?.length) throw new RouteNotFound(res.code === 'NoRoute' ? 'Bu noktalar arasında karayolu rotası bulunamadı.' : `Rota hesaplanamadı (${res.code}).`);
    const r = res.routes[0];
    return {
      distanceKm: r.distance / 1000,
      durationMin: r.duration / 60,
      geometry: simplify(r.geometry.coordinates, 0.0015),
      engine: 'OSRM',
      demoServer: osrmIsDemoServer(),
    } satisfies RoadRoute;
  });
  return value;
}
