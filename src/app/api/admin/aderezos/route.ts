import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { getAderezos, createAderezo } from '@/lib/firestore/aderezos';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await getAderezos());
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, price, available } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const id = await createAderezo({
      name:      name.trim(),
      price:     typeof price === 'number' ? price : 0,
      available: available !== false,
    });
    revalidatePath('/');
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
