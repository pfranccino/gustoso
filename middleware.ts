import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login'))
    || pathname.startsWith('/mostrador');

  if (isProtected) {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Verify it's a real, non-expired JWT — not just any string
    try {
      const payload = decodeJwt(sessionCookie);
      const now = Math.floor(Date.now() / 1000);
      if (!payload.exp || payload.exp < now) {
        // Token expired — clear cookie and redirect
        const res = NextResponse.redirect(new URL('/admin/login', request.url));
        res.cookies.delete('session');
        return res;
      }
    } catch {
      // Not a valid JWT structure
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('session');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/mostrador'],
};
