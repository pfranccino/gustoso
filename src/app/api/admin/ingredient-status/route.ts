import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { getIngredientStatuses, setIngredientStatus } from '@/lib/firestore/ingredientStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await getIngredientStatuses());
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, available } = await request.json();
  if (!name?.trim() || typeof available !== 'boolean')
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  await setIngredientStatus(name.trim(), available);
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
