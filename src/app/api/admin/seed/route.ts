import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { seedMenuIfEmpty } from '@/lib/firestore/seed';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await seedMenuIfEmpty();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/admin/seed]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
