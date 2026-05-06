import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { updateOrderStatus, addOrderNote, OrderStatus } from '@/lib/firestore/orders';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'rejected', 'delivered', 'returned', 'no_answer', 'quote',
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: { status?: OrderStatus; note?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status))
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      await updateOrderStatus(id, body.status);
    }

    if (typeof body.note === 'string' && body.note.trim()) {
      const note = await addOrderNote(id, body.note.trim());
      return NextResponse.json({ ok: true, note });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('orders PATCH error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
