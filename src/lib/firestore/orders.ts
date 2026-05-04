import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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
  locationUrl?: string;
};

export async function createOrder(order: NewOrder) {
  const ref = await getAdminDb().collection('orders').add({
    ...order,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
