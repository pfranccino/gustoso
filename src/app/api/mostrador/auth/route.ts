import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/firestore/settings';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    if (typeof pin !== 'string' || !pin.trim()) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const settings = await getSettings();

    // PIN vacío = no hay token activo
    if (!settings.mostradorPin) {
      return NextResponse.json({ ok: false, reason: 'no_pin' });
    }

    const ok = pin.trim() === settings.mostradorPin;
    if (ok) {
      // Invalidar el PIN inmediatamente — un solo uso
      await updateSettings({ mostradorPin: '' });
    }
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
