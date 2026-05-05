import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type Extra = { name: string; price: number };

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
  extras: Extra[];
  ingredients: string[];
};

export type NewMenuItem = {
  category: string;
  name: string;
  desc?: string | null;
  price?: number | null;
  priceNormal?: number | null;
  priceXL?: number | null;
  extras?: Extra[];
  ingredients?: string[];
  visible?: boolean;
};

export type MenuItemUpdate = Partial<Pick<MenuItem, 'name' | 'desc' | 'price' | 'priceNormal' | 'priceXL' | 'visible' | 'imageUrl' | 'extras' | 'ingredients'>>;

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
      extras:      Array.isArray(d.extras) ? d.extras : [],
      ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
    };
  });
  return items.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.sortOrder - b.sortOrder;
  });
}

export async function createMenuItem(data: NewMenuItem): Promise<string> {
  const maxSnap = await getAdminDb().collection('menu_items')
    .where('category', '==', data.category).get();
  const sortOrder = maxSnap.docs.length;
  const ref = await getAdminDb().collection('menu_items').add({
    category:   data.category,
    name:       data.name,
    desc:       data.desc ?? null,
    price:      data.price ?? null,
    priceNormal: data.priceNormal ?? null,
    priceXL:    data.priceXL ?? null,
    extras:      data.extras ?? [],
    ingredients: data.ingredients ?? [],
    imageUrl:    null,
    group:      null,
    visible:    data.visible ?? true,
    sortOrder,
    createdAt:  FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateMenuItem(id: string, update: MenuItemUpdate): Promise<void> {
  await getAdminDb()
    .collection('menu_items')
    .doc(id)
    .update({ ...update, updatedAt: FieldValue.serverTimestamp() });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await getAdminDb().collection('menu_items').doc(id).delete();
}
