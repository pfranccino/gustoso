import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { updatePromotion, deletePromotion, PromotionUpdate } from '@/lib/firestore/promotions';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await verifySession();
  const body: PromotionUpdate = await request.json();
  await updatePromotion(params.id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await verifySession();
  await deletePromotion(params.id);
  return NextResponse.json({ ok: true });
}
