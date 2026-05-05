import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  size?: string;
  subtotal: number;
};

export type NewOrder = {
  items: OrderItem[];
  total: number;
  itemCount: number;
  sessionId: string;
  locationUrl?: string | null;
};

export type Order = {
  id: string;
  createdAt: string;
  total: number;
  itemCount: number;
  sessionId: string;
  locationUrl?: string;
  items: OrderItem[];
};

export async function createOrder(order: NewOrder) {
  const ref = await getAdminDb().collection('orders').add({
    ...order,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getOrders(limit = 50): Promise<Order[]> {
  const snap = await getAdminDb()
    .collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      createdAt: d.createdAt instanceof Timestamp
        ? d.createdAt.toDate().toISOString()
        : new Date().toISOString(),
      total: d.total ?? 0,
      itemCount: d.itemCount ?? 0,
      sessionId: d.sessionId ?? '',
      locationUrl: d.locationUrl ?? undefined,
      items: d.items ?? [],
    };
  });
}
