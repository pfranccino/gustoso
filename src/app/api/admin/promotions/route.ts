import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getPromotions, createPromotion, NewPromotion } from '@/lib/firestore/promotions';

export const dynamic = 'force-dynamic';

export async function GET() {
  await verifySession();
  const promos = await getPromotions();
  return NextResponse.json(promos);
}

export async function POST(request: NextRequest) {
  await verifySession();
  const body: NewPromotion = await request.json();
  const id = await createPromotion(body);
  return NextResponse.json({ id });
}
