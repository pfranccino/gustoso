'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientFirestore, getClientAuth } from '@/lib/firebase/client';
import { Metrics, DayBucket, RecentOrder } from '@/lib/firestore/metrics';

function dateKey(ts: { toDate(): Date }): string {
  const d = ts.toDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function last14DayKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return keys;
}

function computeMetrics(docs: QueryDocumentSnapshot[]): Metrics {
  let totalRevenue = 0;
  let orderCount = 0;
  const productCount: Record<string, number> = {};
  const dayMap: Record<string, DayBucket> = {};
  const lastOrders: RecentOrder[] = [];

  for (const doc of docs) {
    const d = doc.data();
    totalRevenue += d.total ?? 0;
    orderCount++;

    for (const item of d.items ?? []) {
      productCount[item.name] = (productCount[item.name] ?? 0) + (item.qty ?? 1);
    }

    const ts = d.createdAt;
    if (ts && typeof ts.toDate === 'function') {
      const key = dateKey(ts);
      if (!dayMap[key]) dayMap[key] = { date: key, total: 0, count: 0 };
      dayMap[key].total += d.total ?? 0;
      dayMap[key].count++;
    }

    if (lastOrders.length < 10) {
      lastOrders.push({
        id: doc.id,
        createdAt: ts && typeof ts.toDate === 'function'
          ? ts.toDate().toISOString()
          : new Date().toISOString(),
        total: d.total ?? 0,
        itemCount: d.itemCount ?? 0,
        items: (d.items ?? []).map((it: { name: string; qty: number; subtotal: number }) => ({
          name: it.name, qty: it.qty, subtotal: it.subtotal,
        })),
      });
    }
  }

  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;
  const last14Days = last14DayKeys().map(k => dayMap[k] ?? { date: k, total: 0, count: 0 });

  return { totalRevenue, orderCount, avgTicket, topProduct, last14Days, lastOrders };
}

export function useLiveMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    let unsubSnap: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(getClientAuth(), (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = undefined; }
      if (!user) return; // esperar — onAuthStateChanged vuelve a disparar con el usuario

      const q = query(collection(getClientFirestore(), 'orders'), orderBy('createdAt', 'desc'));
      unsubSnap = onSnapshot(
        q,
        (snap) => { setMetrics(computeMetrics(snap.docs)); setLoading(false); setError(false); },
        ()     => { setError(true); setLoading(false); },
      );
    });

    return () => { unsubAuth(); if (unsubSnap) unsubSnap(); };
  }, []);

  return { metrics, loading, error };
}
