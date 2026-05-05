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
  const snap = await getAdminDb().collection('menu_items').get();
  const items: MenuItem[] = snap.docs.map(doc => {
    const d = doc.data();
    return {
      id:          doc.id,
      category:    d.category    ?? '',
      group:       d.group       ?? undefined,
      name:        d.name        ?? '',
      desc:        d.desc        ?? null,
      price:       d.price       ?? null,
      priceNormal: d.priceNormal ?? null,
      priceXL:     d.priceXL     ?? null,
      imageUrl:    d.imageUrl    ?? null,
      visible:     d.visible     ?? true,
      sortOrder:   d.sortOrder   ?? 0,
    };
  });
  return items.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.sortOrder - b.sortOrder;
  });
}

export async function updateMenuItem(id: string, update: MenuItemUpdate): Promise<void> {
  await getAdminDb()
    .collection('menu_items')
    .doc(id)
    .update({ ...update, updatedAt: FieldValue.serverTimestamp() });
}
