import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const EXAMPLE_PROMOTIONS = [
  {
    name:        'Combo Completo + Bebida',
    description: 'Completo italiano + bebida 500ml a elección',
    price:       3990,
    badge:       'PROMO',
    items:       ['Completo italiano', 'Bebida 500ml a elección'],
    visible:     true,
    sortOrder:   0,
    imageUrl:    null,
  },
  {
    name:        'Combo AS + Papas',
    description: 'Sándwich AS completo + papas medianas',
    price:       5490,
    badge:       'COMBO',
    items:       ['Sándwich AS a elección', 'Papas medianas'],
    visible:     true,
    sortOrder:   1,
    imageUrl:    null,
  },
  {
    name:        'Combo Churrasco + Bebida',
    description: 'Sándwich churrasco italiano + bebida 500ml',
    price:       5990,
    badge:       'PROMO',
    items:       ['Sándwich churrasco italiano', 'Bebida 500ml a elección'],
    visible:     true,
    sortOrder:   2,
    imageUrl:    null,
  },
  {
    name:        'Combo Mechada + Papas',
    description: 'Sándwich mechada + papas chicas',
    price:       5490,
    badge:       'COMBO',
    items:       ['Sándwich mechada a elección', 'Papas chicas'],
    visible:     true,
    sortOrder:   3,
    imageUrl:    null,
  },
  {
    name:        'Combo Familiar',
    description: '2 completos italianos + 2 bebidas 500ml',
    price:       6990,
    badge:       'OFERTA',
    items:       ['2× Completo italiano', '2× Bebida 500ml a elección'],
    visible:     true,
    sortOrder:   4,
    imageUrl:    null,
  },
  {
    name:        'Combo Papas + Bebida',
    description: 'Papas medianas + bebida 500ml',
    price:       2990,
    badge:       'ESPECIAL',
    items:       ['Papas medianas', 'Bebida 500ml a elección'],
    visible:     true,
    sortOrder:   5,
    imageUrl:    null,
  },
];

export const dynamic = 'force-dynamic';

export async function POST() {
  await verifySession();

  const db = getAdminDb();

  // Solo inserta si la colección está vacía
  const existing = await db.collection('promotions').limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ skipped: true, reason: 'Ya existen promociones' });
  }

  const batch = db.batch();
  for (const promo of EXAMPLE_PROMOTIONS) {
    const ref = db.collection('promotions').doc();
    batch.set(ref, { ...promo, createdAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();

  return NextResponse.json({ seeded: EXAMPLE_PROMOTIONS.length });
}
