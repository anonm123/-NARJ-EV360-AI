import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { searchStations, validBBox, MAX_SPAN_DEG, ocmConfigured } from '@/lib/stations';
import { rateLimit } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const Q = z.object({ south: z.coerce.number(), west: z.coerce.number(), north: z.coerce.number(), east: z.coerce.number() });

/** GET /api/stations?south=&west=&north=&east= — gerçek kaynaklardan (OCM + OSM) birleştirilmiş istasyonlar. */
export async function GET(req: NextRequest) {
  if (!(await rateLimit('api:stations', 60, 60_000))) return NextResponse.json({ error: 'Çok fazla istek. Lütfen biraz bekleyin.' }, { status: 429 });
  const parsed = Q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success || !validBBox(parsed.data)) return NextResponse.json({ error: 'Geçersiz bölge. Türkiye sınırları içinde bir alan seçin.' }, { status: 400 });
  const b = parsed.data;
  if (b.north - b.south > MAX_SPAN_DEG || b.east - b.west > MAX_SPAN_DEG * 1.4) {
    return NextResponse.json({ error: 'Alan çok geniş. Haritayı yakınlaştırın veya bir il seçin.', tooLarge: true }, { status: 422 });
  }
  const result = await searchStations(b);
  return NextResponse.json({ ...result, ocmConfigured: ocmConfigured(), generatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, max-age=60' } });
}
