import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getDiscountCodes, createDiscountCode } from '@/lib/firestore/discountCodes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const codes = await getDiscountCodes();
  return NextResponse.json(codes);
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { code, type, value, description, maxUses, expiresAt, active } = body;
    if (!code || !type || value == null) {
      return NextResponse.json({ error: 'code, type y value son requeridos' }, { status: 400 });
    }
    await createDiscountCode({ code, type, value, description: description ?? '', maxUses: maxUses ?? 1, expiresAt: expiresAt ?? null, active: active ?? true });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    // Firestore lanza si el doc ya existe con ese ID
    if (msg.includes('already exists') || msg.includes('ALREADY_EXISTS')) {
      return NextResponse.json({ error: 'Ese código ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
