import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const doc = await getAdminDb().collection('settings').doc('main').get();
    const d = doc.data();
    const toISO = (f: unknown) => f && typeof (f as { toDate?: () => Date }).toDate === 'function'
      ? (f as { toDate: () => Date }).toDate().toISOString()
      : null;
    return NextResponse.json({
      startedAt: toISO(d?.dayStartedAt),
      closedAt:  toISO(d?.dayClosedAt),
    });
  } catch {
    return NextResponse.json({ startedAt: null, closedAt: null });
  }
}

export async function POST() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await getAdminDb().collection('settings').doc('main').set(
      { dayStartedAt: FieldValue.serverTimestamp(), dayClosedAt: null },
      { merge: true }
    );
    return NextResponse.json({ ok: true, startedAt: new Date().toISOString() });
  } catch (err) {
    console.error('start-day error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await getAdminDb().collection('settings').doc('main').set(
      { dayClosedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return NextResponse.json({ ok: true, closedAt: new Date().toISOString() });
  } catch (err) {
    console.error('close-day error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
