import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/firestore/orders';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, sessionId, locationUrl, orderId } = body;

    if (!items?.length || !total || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderItems = items.map((i: { name: string; qty: number; price: number; size?: string }) => ({
      name:     i.name,
      qty:      i.qty,
      price:    i.price,
      size:     i.size ?? null,
      subtotal: i.price * i.qty,
    }));

    const id = await createOrder({
      items:      orderItems,
      total,
      itemCount:  items.reduce((s: number, i: { qty: number }) => s + i.qty, 0),
      sessionId,
      orderId:    orderId ?? undefined,
      locationUrl: locationUrl ?? null,
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
