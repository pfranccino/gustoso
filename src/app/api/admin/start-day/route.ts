import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function POST() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await getAdminDb().collection('settings').doc('main').set(
      { dayStartedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return NextResponse.json({ ok: true, startedAt: new Date().toISOString() });
  } catch (err) {
    console.error('start-day error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const doc = await getAdminDb().collection('settings').doc('main').get();
    const d = doc.data();
    const ts = d?.dayStartedAt;
    const startedAt = ts && typeof ts.toDate === 'function'
      ? ts.toDate().toISOString()
      : null;
    return NextResponse.json({ startedAt });
  } catch {
    return NextResponse.json({ startedAt: null });
  }
}
