import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode } from '@/lib/firestore/discountCodes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Código inválido' });
    }
    const result = await validateDiscountCode(code);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, error: 'Error al validar' });
  }
}
