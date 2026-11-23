import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Hafif sağlık kontrolü: veritabanına veya dış servislere dokunmaz (Render healthcheck + uyanık tutma). */
export function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
