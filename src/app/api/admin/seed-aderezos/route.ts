import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const ADEREZOS = [
  { name: 'Ketchup',          price: 0 },
  { name: 'Mostaza Amarilla', price: 0 },
  { name: 'Mayonesa',         price: 0 },
  { name: 'Salsa BBQ',        price: 0 },
  { name: 'Salsa Tártara',    price: 0 },
  { name: 'Relish',           price: 0 },
  { name: 'Salsa Alioli',     price: 0 },
  { name: 'Mostaza Dijon',    price: 0 },
];

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db    = getAdminDb();
  const body  = await request.json().catch(() => ({}));
  const force = body?.force === true;

  if (!force) {
    const existing = await db.collection('aderezos').limit(1).get();
    if (!existing.empty) return NextResponse.json({ skipped: true, reason: 'Ya existen aderezos' });
  } else {
    const snap = await db.collection('aderezos').get();
    const del  = db.batch();
    snap.docs.forEach(d => del.delete(d.ref));
    if (!snap.empty) await del.commit();
  }

  const batch = db.batch();
  for (const a of ADEREZOS) {
    batch.set(db.collection('aderezos').doc(), {
      ...a, available: true, createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  revalidatePath('/');

  return NextResponse.json({ seeded: true, count: ADEREZOS.length });
}
