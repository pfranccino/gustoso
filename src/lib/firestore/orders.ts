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
  orderId?: string;
  locationUrl?: string | null;
};

export type OrderStatus = 'pending' | 'confirmed' | 'rejected';

export type Order = {
  id: string;
  orderId?: string;
  createdAt: string;
  total: number;
  itemCount: number;
  sessionId: string;
  locationUrl?: string;
  status: OrderStatus;
  items: OrderItem[];
};

export async function createOrder(order: NewOrder) {
  const ref = await getAdminDb().collection('orders').add({
    ...order,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await getAdminDb().collection('orders').doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() });
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
      orderId: d.orderId ?? undefined,
      sessionId: d.sessionId ?? '',
      locationUrl: d.locationUrl ?? undefined,
      status: (d.status ?? 'pending') as OrderStatus,
      items: d.items ?? [],
    };
  });
}
