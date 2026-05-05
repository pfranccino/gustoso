import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getMetrics } from '@/lib/firestore/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getMetrics();
    return NextResponse.json(data);
  } catch (err) {
    console.error('metrics error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
