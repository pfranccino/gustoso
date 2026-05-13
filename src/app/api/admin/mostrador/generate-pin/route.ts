import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { updateSettings } from '@/lib/firestore/settings';

export const dynamic = 'force-dynamic';

export async function POST() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // PIN de 6 dígitos, siempre 6 caracteres (con ceros a la izquierda si hace falta)
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  await updateSettings({ mostradorPin: pin });
  return NextResponse.json({ pin });
}
