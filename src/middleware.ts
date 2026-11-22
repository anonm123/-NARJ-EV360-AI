import { NextResponse, type NextRequest } from 'next/server';

/** Panel rotaları için hızlı ön kontrol; asıl doğrulama sunucu tarafında (requireUser) yapılır. */
export function middleware(req: NextRequest) {
  if (!req.cookies.get('narj_session')?.value) {
    const url = req.nextUrl.clone();
    url.pathname = '/giris';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/panel/:path*'] };
