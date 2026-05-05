import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export type DayBucket = { date: string; total: number; count: number };

export type Metrics = {
  totalRevenue: number;
  orderCount: number;
  avgTicket: number;
  topProduct: string;
  last14Days: DayBucket[];
  lastOrders: RecentOrder[];
};

export type RecentOrder = {
  id: string;
  createdAt: string;
  total: number;
  itemCount: number;
  items: { name: string; qty: number; subtotal: number }[];
};

function dateKey(ts: Timestamp): string {
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function last14DayKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export async function getMetrics(): Promise<Metrics> {
  const db = getAdminDb();
  const snap = await db.collection('orders').orderBy('createdAt', 'desc').get();

  let totalRevenue = 0;
  let orderCount = 0;
  const productCount: Record<string, number> = {};
  const dayMap: Record<string, DayBucket> = {};
  const lastOrders: RecentOrder[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    totalRevenue += d.total ?? 0;
    orderCount++;

    for (const item of d.items ?? []) {
      productCount[item.name] = (productCount[item.name] ?? 0) + (item.qty ?? 1);
    }

    if (d.createdAt instanceof Timestamp) {
      const key = dateKey(d.createdAt);
      if (!dayMap[key]) dayMap[key] = { date: key, total: 0, count: 0 };
      dayMap[key].total += d.total ?? 0;
      dayMap[key].count++;
    }

    if (lastOrders.length < 10) {
      lastOrders.push({
        id: doc.id,
        createdAt: d.createdAt instanceof Timestamp
          ? d.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        total: d.total ?? 0,
        itemCount: d.itemCount ?? 0,
        items: (d.items ?? []).map((it: { name: string; qty: number; subtotal: number }) => ({
          name: it.name,
          qty: it.qty,
          subtotal: it.subtotal,
        })),
      });
    }
  }

  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;

  const keys = last14DayKeys();
  const last14Days = keys.map(k => dayMap[k] ?? { date: k, total: 0, count: 0 });

  return { totalRevenue, orderCount, avgTicket, topProduct, last14Days, lastOrders };
}
