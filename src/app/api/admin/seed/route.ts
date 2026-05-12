import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { seedMenuIfEmpty } from '@/lib/firestore/seed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body  = await request.json().catch(() => ({}));
    const force = body?.force === true;
    const result = await seedMenuIfEmpty(force);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/admin/seed]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
