import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/firestore/menuItems';

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
