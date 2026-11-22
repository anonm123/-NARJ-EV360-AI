import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(user ? { user: { name: user.name, role: user.role } } : { user: null }, { headers: { 'Cache-Control': 'no-store' } });
}
