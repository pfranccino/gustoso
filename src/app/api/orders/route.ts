import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/firestore/orders';
import { validateDiscountCode, redeemDiscountCode } from '@/lib/firestore/discountCodes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, sessionId, locationUrl, orderId, paymentMethod, discountCode, deliveryFee } = body;

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

    // Validar y aplicar descuento si viene un código
    let discountAmount: number | undefined;
    let validatedCode: string | undefined;
    if (discountCode && typeof discountCode === 'string') {
      const result = await validateDiscountCode(discountCode);
      if (result.valid) {
        discountAmount = result.type === 'percent'
          ? Math.round(total * result.value / 100)
          : result.value;
        validatedCode = discountCode.trim().toUpperCase();
        await redeemDiscountCode(validatedCode);
      }
    }

    const fee = typeof deliveryFee === 'number' && deliveryFee > 0 ? deliveryFee : 0;
    const finalTotal = Math.max(0, total - (discountAmount ?? 0)) + fee;

    const id = await createOrder({
      items:          orderItems,
      total:          finalTotal,
      itemCount:      items.reduce((s: number, i: { qty: number }) => s + i.qty, 0),
      sessionId,
      orderId:        orderId ?? undefined,
      locationUrl:    locationUrl ?? null,
      paymentMethod:  paymentMethod ?? null,
      discountCode:   validatedCode ?? null,
      discountAmount: discountAmount ?? null,
      deliveryFee:    fee || null,
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
