import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { updateCost, deleteCost } from '@/lib/firestore/costs';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name       === 'string') update.name       = body.name.trim();
    if (typeof body.date       === 'string') update.date       = body.date;
    if (typeof body.notes      === 'string') update.notes      = body.notes.trim();
    if (typeof body.quantity   === 'number') update.quantity   = body.quantity;
    if (typeof body.totalPrice === 'number') {
      update.totalPrice = body.totalPrice;
      const qty = typeof body.quantity === 'number' ? body.quantity : undefined;
      if (qty && qty > 0) update.unitPrice = Math.round((body.totalPrice / qty) * 100) / 100;
    }
    await updateCost(params.id, update);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await deleteCost(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
