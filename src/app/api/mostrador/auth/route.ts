import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/firestore/settings';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    if (typeof pin !== 'string' || !pin.trim()) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const settings = await getSettings();
    const ok = pin.trim() === settings.mostradorPin;
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
