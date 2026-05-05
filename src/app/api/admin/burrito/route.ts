import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getBurritoConfig, updateBurritoConfig, BurritoConfig } from '@/lib/firestore/burritoConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  await verifySession();
  const config = await getBurritoConfig();
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  await verifySession();
  const body: BurritoConfig = await request.json();
  await updateBurritoConfig(body);
  return NextResponse.json({ ok: true });
}
