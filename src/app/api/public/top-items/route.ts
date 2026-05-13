import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export const revalidate = 300; // 5 min cache

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection('orders')
      .where('status', 'in', ['confirmed', 'delivered'])
      .orderBy('createdAt', 'desc')
      .limit(300)
      .get();

    const counts: Record<string, number> = {};
    snap.docs.forEach(doc => {
      const items = doc.data().items ?? [];
      (items as { name: string; qty: number }[]).forEach(item => {
        const key = item.name.trim();
        counts[key] = (counts[key] ?? 0) + (item.qty ?? 1);
      });
    });

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json(top);
  } catch {
    return NextResponse.json([]);
  }
}
