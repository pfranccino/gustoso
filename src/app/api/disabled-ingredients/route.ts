import { NextResponse } from 'next/server';
import { getDisabledIngredients } from '@/lib/firestore/ingredientStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  const names = await getDisabledIngredients();
  return NextResponse.json(names, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
