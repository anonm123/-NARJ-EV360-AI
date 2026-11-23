import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { roadRoute, RouteNotFound } from '@/lib/routing/osrm';
import { corridorStations } from '@/lib/stations/corridor';
import { rateLimit } from '@/lib/server/auth';
import type { LngLat } from '@/lib/routing/geometry';

export const dynamic = 'force-dynamic';

const point = z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).transform((s) => s.split(',').map(Number) as LngLat);
const Q = z.object({ from: point, to: point, via: point.optional() });
const inTR = ([lng, lat]: LngLat) => lat >= 35 && lat <= 42.5 && lng >= 25 && lng <= 45.5;

/** GET /api/route/stations?from=lng,lat&to=lng,lat[&via=lng,lat] — OSRM rotası boyunca (≤5 km) gerçek istasyonlar. */
export async function GET(req: NextRequest) {
  if (!(await rateLimit('api:route-stations', 20, 60_000))) return NextResponse.json({ error: 'Çok fazla istek. Lütfen biraz bekleyin.' }, { status: 429 });
  const parsed = Q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Geçersiz başlangıç/varış koordinatı.' }, { status: 400 });
  const pts = [parsed.data.from, ...(parsed.data.via ? [parsed.data.via] : []), parsed.data.to];
  if (!pts.every(inTR)) return NextResponse.json({ error: 'Noktalar Türkiye sınırları içinde olmalı.' }, { status: 400 });
  try {
    const route = await roadRoute(pts); // önbellekli; /api/route ile aynı geometri
    const result = await corridorStations(route.geometry, route.distanceKm);
    return NextResponse.json({ ...result, generatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (e) {
    if (e instanceof RouteNotFound) return NextResponse.json({ error: e.message }, { status: 404 });
    return NextResponse.json({ error: 'Rota servisine şu an ulaşılamıyor.' }, { status: 502 });
  }
}
