import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type Category = {
  id:        string;   // slug: "vienesas", "as", etc.
  label:     string;   // "Vienesas"
  emoji:     string;   // "🌭"
  sortOrder: number;
  visible:   boolean;
  special?:  'burrito'; // marca el tab que abre BurritoBuilder
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id:'promos',    label:'Promos',      emoji:'🏷️',  sortOrder:0, visible:true },
  { id:'vienesas',  label:'Vienesas',    emoji:'🌭',  sortOrder:1, visible:true },
  { id:'as',        label:'AS',          emoji:'🥪',  sortOrder:2, visible:true },
  { id:'churrasco', label:'Churrasco',   emoji:'🥩',  sortOrder:3, visible:true },
  { id:'mechada',   label:'Mechada',     emoji:'🥖',  sortOrder:4, visible:true },
  { id:'burrito',   label:'Burrito',     emoji:'🌯',  sortOrder:5, visible:true, special:'burrito' },
  { id:'papas',     label:'Papas & Más', emoji:'🍟',  sortOrder:6, visible:true },
  { id:'bebidas',   label:'Bebidas',     emoji:'🥤',  sortOrder:7, visible:true },
];

const DOC = () => getAdminDb().collection('settings').doc('categories');

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await DOC().get();
    if (!snap.exists) return DEFAULT_CATEGORIES;
    const items = snap.data()?.items;
    if (!Array.isArray(items) || items.length === 0) return DEFAULT_CATEGORIES;
    return items as Category[];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function updateCategories(items: Category[]): Promise<void> {
  await DOC().set({ items, updatedAt: FieldValue.serverTimestamp() }, { merge: false });
}

export async function getCategoriesUpdatedAt(): Promise<string | null> {
  try {
    const snap = await DOC().get();
    const ts = snap.data()?.updatedAt;
    return ts?.toDate ? ts.toDate().toISOString() : null;
  } catch {
    return null;
  }
}
