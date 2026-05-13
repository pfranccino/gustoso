import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Category } from './categoriesTypes';
import { DEFAULT_CATEGORIES } from './categoriesTypes';

export type { Category } from './categoriesTypes';
export { DEFAULT_CATEGORIES } from './categoriesTypes';

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
