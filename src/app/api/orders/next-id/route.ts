import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now   = new Date();
    const dd    = String(now.getDate()).padStart(2, '0');
    const mm    = String(now.getMonth() + 1).padStart(2, '0');

    // Rango: desde las 00:00 hasta las 23:59:59 de hoy (hora local Chile UTC-4)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const snap = await getAdminDb()
      .collection('orders')
      .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
      .where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      .get();

    const count  = snap.size + 1;
    const num    = String(count).padStart(2, '0');
    const orderId = `GST-${dd}${mm}${num}`;

    return NextResponse.json({ orderId });
  } catch {
    // Fallback: formato anterior si Firestore falla
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GST-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return NextResponse.json({ orderId: code });
  }
}
