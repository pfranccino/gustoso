import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems, createMenuItem } from '@/lib/firestore/menuItems';
import { verifySession } from '@/lib/auth/verifySession';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getMenuItems();
    return NextResponse.json(items);
  } catch (err) {
    console.error('menu GET error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { category, name, desc, volume, price, priceNormal, priceXL, extras, ingredients, visible } = body;
    if (!category || !name) return NextResponse.json({ error: 'category and name required' }, { status: 400 });
    const id = await createMenuItem({ category, name, desc, volume, price, priceNormal, priceXL, extras, ingredients, visible });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('menu POST error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
