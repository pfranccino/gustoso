import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getCosts, createCost } from '@/lib/firestore/costs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await getCosts());
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, quantity, totalPrice, date, notes } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const qty   = typeof quantity   === 'number' ? quantity   : parseFloat(quantity)   || 0;
    const total = typeof totalPrice === 'number' ? totalPrice : parseFloat(totalPrice) || 0;
    const unit  = qty > 0 ? Math.round((total / qty) * 100) / 100 : 0;
    const id = await createCost({
      name:       name.trim(),
      quantity:   qty,
      totalPrice: total,
      unitPrice:  unit,
      date:       date || new Date().toISOString().slice(0, 10),
      notes:      notes?.trim() || '',
    });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
