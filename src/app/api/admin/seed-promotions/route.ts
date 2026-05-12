import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const EXAMPLE_PROMOTIONS = [
  {
    name:        'Combo AS + Bebida',
    description: 'Sándwich AS a elección + bebida a elección',
    price:       4990,
    badge:       'COMBO',
    items:       ['Sándwich AS', 'Bebida'],
    choices:     [
      { label: 'Tipo de AS',  category: 'as',      options: [], required: true  },
      { label: 'Bebida',      category: 'bebidas',  options: [], required: true  },
    ],
    visible:     true,
    sortOrder:   0,
    imageUrl:    null,
  },
  {
    name:        'Combo Churrasco + Bebida',
    description: 'Sándwich churrasco a elección + bebida a elección',
    price:       5990,
    badge:       'PROMO',
    items:       ['Sándwich Churrasco', 'Bebida'],
    choices:     [
      { label: 'Tipo de Churrasco', category: 'churrasco', options: [], required: true },
      { label: 'Bebida',            category: 'bebidas',   options: [], required: true },
    ],
    visible:     true,
    sortOrder:   1,
    imageUrl:    null,
  },
  {
    name:        'Combo Mechada + Bebida',
    description: 'Sándwich mechada a elección + bebida a elección',
    price:       6490,
    badge:       'COMBO',
    items:       ['Sándwich Mechada', 'Bebida'],
    choices:     [
      { label: 'Tipo de Mechada', category: 'mechada', options: [], required: true },
      { label: 'Bebida',          category: 'bebidas', options: [], required: true },
    ],
    visible:     true,
    sortOrder:   2,
    imageUrl:    null,
  },
  {
    name:        'Combo Churrasco + Papas + Bebida',
    description: 'Churrasco a elección + papas fritas + bebida',
    price:       7490,
    badge:       'OFERTA',
    items:       ['Sándwich Churrasco', 'Papas Fritas', 'Bebida'],
    choices:     [
      { label: 'Tipo de Churrasco', category: 'churrasco', options: [], required: true },
      { label: 'Bebida',            category: 'bebidas',   options: [], required: true },
    ],
    visible:     true,
    sortOrder:   3,
    imageUrl:    null,
  },
  {
    name:        'Combo Vienesa + Bebida',
    description: 'Vienesa a elección + bebida a elección',
    price:       2990,
    badge:       'ESPECIAL',
    items:       ['Vienesa', 'Bebida'],
    choices:     [
      { label: 'Tipo de Vienesa', category: 'vienesas', options: [], required: true },
      { label: 'Bebida',          category: 'bebidas',  options: [], required: false },
    ],
    visible:     true,
    sortOrder:   4,
    imageUrl:    null,
  },
];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db    = getAdminDb();
  const body  = await request.json().catch(() => ({}));
  const force = body?.force === true;

  if (!force) {
    const existing = await db.collection('promotions').limit(1).get();
    if (!existing.empty) return NextResponse.json({ skipped: true, reason: 'Ya existen promociones' });
  } else {
    const snap = await db.collection('promotions').get();
    const del  = db.batch();
    snap.docs.forEach(d => del.delete(d.ref));
    if (!snap.empty) await del.commit();
  }

  const batch = db.batch();
  for (const promo of EXAMPLE_PROMOTIONS) {
    batch.set(db.collection('promotions').doc(), { ...promo, createdAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  revalidatePath('/');

  return NextResponse.json({ seeded: true, count: EXAMPLE_PROMOTIONS.length });
}
