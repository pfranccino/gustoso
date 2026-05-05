import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type MenuItem = {
  id: string;
  category: string;
  group?: string;
  name: string;
  desc: string | null;
  price: number | null;
  priceNormal: number | null;
  priceXL: number | null;
  imageUrl: string | null;
  visible: boolean;
  sortOrder: number;
};

export type MenuItemUpdate = Partial<Pick<MenuItem, 'name' | 'desc' | 'price' | 'priceNormal' | 'priceXL' | 'visible' | 'imageUrl'>>;

export async function getMenuItems(): Promise<MenuItem[]> {
  const snap = await getAdminDb()
    .collection('menu_items')
    .orderBy('category')
    .orderBy('sortOrder')
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
}

export async function updateMenuItem(id: string, update: MenuItemUpdate): Promise<void> {
  await getAdminDb()
    .collection('menu_items')
    .doc(id)
    .update({ ...update, updatedAt: FieldValue.serverTimestamp() });
}
