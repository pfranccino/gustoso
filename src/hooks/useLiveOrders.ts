'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, Timestamp, QueryDocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getClientFirestore, getClientAuth } from '@/lib/firebase/client';
import { Order, OrderStatus, OrderSource } from '@/lib/firestore/orders';

function docToOrder(doc: QueryDocumentSnapshot): Order {
  const d = doc.data();
  return {
    id:             doc.id,
    orderId:        d.orderId        ?? undefined,
    createdAt:      d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
    total:          d.total          ?? 0,
    itemCount:      d.itemCount      ?? 0,
    sessionId:      d.sessionId      ?? '',
    locationUrl:    d.locationUrl    ?? undefined,
    paymentMethod:  d.paymentMethod  ?? undefined,
    discountCode:   d.discountCode   ?? undefined,
    discountAmount: d.discountAmount ?? undefined,
    deliveryFee:    d.deliveryFee    ?? undefined,
    status:         (d.status        ?? 'pending') as OrderStatus,
    source:         (d.source        ?? 'whatsapp') as OrderSource,
    items:          d.items          ?? [],
    notes:          Array.isArray(d.notes) ? d.notes : [],
  };
}

export function useLiveOrders(dayStartedAt: Date | null) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let unsubSnap: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(getClientAuth(), (user) => {
      if (unsubSnap) { unsubSnap(); unsubSnap = undefined; }
      if (!user) return;

      const db = getClientFirestore();
      const q = dayStartedAt
        ? query(
            collection(db, 'orders'),
            where('createdAt', '>=', Timestamp.fromDate(dayStartedAt)),
            orderBy('createdAt', 'desc')
          )
        : query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

      unsubSnap = onSnapshot(
        q,
        (snap) => { setOrders(snap.docs.map(docToOrder)); setLoading(false); setError(false); },
        ()     => { setError(true); setLoading(false); }
      );
    });

    return () => { unsubAuth(); if (unsubSnap) unsubSnap(); };
  }, [dayStartedAt]);

  return { orders, loading, error };
}
