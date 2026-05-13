'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientFirestore, getClientAuth } from '@/lib/firebase/client';
import { Metrics, DayBucket, RecentOrder, TopProduct } from '@/lib/firestore/metrics';

export type PaymentBreakdown = { method: string; label: string; total: number; count: number; pct: number };

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
      const key = item.size ? `${item.name} (${String(item.size).toUpperCase()})` : item.name;
      productCount[key] = (productCount[key] ?? 0) + (item.qty ?? 1);
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

  const topEntry = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];
  const topProduct: TopProduct | null = topEntry ? { name: topEntry[0], qty: topEntry[1] } : null;
  const avgTicket = orderCount > 0 ? totalRevenue / orderCount : 0;
  const last14Days = last14DayKeys().map(k => dayMap[k] ?? { date: k, total: 0, count: 0 });

  return { totalRevenue, orderCount, avgTicket, topProduct, last14Days, lastOrders };
}

export function useLiveMetrics() {
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
  const [payment, setPayment]   = useState<PaymentBreakdown[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    let unsubSnap: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(getClientAuth(), (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = undefined; }
      if (!user) return; // esperar — onAuthStateChanged vuelve a disparar con el usuario

      const q = query(collection(getClientFirestore(), 'orders'), orderBy('createdAt', 'desc'));
      unsubSnap = onSnapshot(
        q,
        (snap) => {
          setMetrics(computeMetrics(snap.docs));
          // Payment breakdown from all docs
          const pmMap: Record<string, { total: number; count: number }> = {};
          let pmGrand = 0;
          for (const doc of snap.docs) {
            const d = doc.data();
            const pm: string = d.paymentMethod ?? 'none';
            if (!pmMap[pm]) pmMap[pm] = { total: 0, count: 0 };
            pmMap[pm].total += d.total ?? 0;
            pmMap[pm].count++;
            pmGrand += d.total ?? 0;
          }
          const PM_LABEL: Record<string, string> = { efectivo:'💵 Efectivo', transferencia:'🏦 Transferencia', debito:'💳 Débito/Crédito', none:'Sin especificar' };
          const breakdown: PaymentBreakdown[] = Object.entries(pmMap)
            .map(([m, v]) => ({ method: m, label: PM_LABEL[m] ?? m, total: v.total, count: v.count, pct: pmGrand > 0 ? Math.round((v.total / pmGrand) * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
          setPayment(breakdown);
          setLoading(false); setError(false);
        },
        ()     => { setError(true); setLoading(false); },
      );
    });

    return () => { unsubAuth(); if (unsubSnap) unsubSnap(); };
  }, []);

  return { metrics, payment, loading, error };
}
