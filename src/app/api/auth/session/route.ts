import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días en segundos

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: COOKIE_MAX_AGE * 1000, // ms
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   COOKIE_MAX_AGE,
      path:     '/',
    });
    return response;
  } catch (err) {
    console.error('[POST /api/auth/session]', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
