import 'server-only';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import countries from 'world-atlas/countries-50m.json';

/** Türkiye sınırı (Natural Earth / world-atlas, kamu malı veri) → SVG path. */
export const TR_VIEW = { minLng: 25.6, maxLng: 44.9, minLat: 35.75, maxLat: 42.2 };
const LAT0 = (39 * Math.PI) / 180;

export function viewSize(width = 1000) {
  const spanX = (TR_VIEW.maxLng - TR_VIEW.minLng) * Math.cos(LAT0);
  const spanY = TR_VIEW.maxLat - TR_VIEW.minLat;
  return { width, height: Math.round((width * spanY) / spanX) };
}

export function projector(width = 1000) {
  const { height } = viewSize(width);
  return (lat: number, lng: number) => [
    ((lng - TR_VIEW.minLng) / (TR_VIEW.maxLng - TR_VIEW.minLng)) * width,
    ((TR_VIEW.maxLat - lat) / (TR_VIEW.maxLat - TR_VIEW.minLat)) * height,
  ] as const;
}

let cachedGeo: Feature<Polygon | MultiPolygon> | null = null;
export function turkeyFeature() {
  if (cachedGeo) return cachedGeo;
  const topo = countries as unknown as Topology<{ countries: GeometryCollection }>;
  const fc = feature(topo, topo.objects.countries);
  const tr = fc.features.find((f) => String(f.id) === '792') as Feature<Polygon | MultiPolygon> | undefined;
  if (!tr) throw new Error('Türkiye geometrisi bulunamadı');
  cachedGeo = tr;
  return tr;
}

export function turkeyPath(width = 1000) {
  const p = projector(width);
  const g = turkeyFeature().geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys
    .map((poly) =>
      poly
        .map((ring) => 'M' + ring.map(([lng, lat]) => p(lat, lng).map((n) => n.toFixed(1)).join(',')).join('L') + 'Z')
        .join(''),
    )
    .join('');
}

/** Leaflet için GeoJSON (istemciye prop olarak gönderilir). */
export function turkeyGeoJson() {
  return turkeyFeature();
}

import { CITIES } from './data/cities';
/** Rota planlayıcı için istemciye gönderilecek hafif geometri paketi. */
export function mapGeometry(width = 1000) {
  const { height } = viewSize(width);
  const p = projector(width);
  return {
    path: turkeyPath(width),
    width,
    height,
    bounds: { ...TR_VIEW },
    cities: Object.fromEntries(CITIES.map((c) => [c.id, p(c.lat, c.lng).map((n) => +n.toFixed(1)) as [number, number]])),
  };
}
