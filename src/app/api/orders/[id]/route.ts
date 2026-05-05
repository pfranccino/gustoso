import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { updateOrderStatus, OrderStatus } from '@/lib/firestore/orders';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'rejected'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: { status?: OrderStatus };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    await updateOrderStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('orders PATCH error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
