import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const snap = await getAdminDb()
      .collection('orders')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const d = doc.data();

    return NextResponse.json({
      orderId:       d.orderId       ?? orderId,
      status:        d.status        ?? 'pending',
      createdAt:     d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : null,
      total:         d.total         ?? 0,
      deliveryFee:   d.deliveryFee   ?? null,
      paymentMethod: d.paymentMethod ?? null,
      itemCount:     d.itemCount     ?? 0,
      items:         (d.items        ?? []) as Array<{ name: string; qty: number; price: number; size?: string }>,
    });
  } catch (err) {
    console.error('[GET /api/pedido]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
