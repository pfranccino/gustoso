import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
export type { CostEntry } from './costsTypes';
import type { CostEntry, Unit } from './costsTypes';
import { UNITS } from './costsTypes';

export async function getCosts(): Promise<CostEntry[]> {
  const snap = await getAdminDb().collection('costs').orderBy('date', 'desc').get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id:         doc.id,
      name:       typeof d.name       === 'string' ? d.name       : '',
      quantity:   typeof d.quantity   === 'number' ? d.quantity   : 0,
      unit:       (UNITS as readonly string[]).includes(d.unit) ? d.unit as Unit : 'unidad',
      totalPrice: typeof d.totalPrice === 'number' ? d.totalPrice : 0,
      unitPrice:  typeof d.unitPrice  === 'number' ? d.unitPrice  : 0,
      date:       typeof d.date       === 'string' ? d.date       : '',
      notes:      typeof d.notes      === 'string' ? d.notes      : '',
      createdAt:  d.createdAt?.toDate?.()?.toISOString?.() ?? '',
    };
  });
}

export async function createCost(data: Omit<CostEntry, 'id' | 'createdAt'>): Promise<string> {
  const ref = await getAdminDb().collection('costs').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateCost(id: string, data: Partial<Omit<CostEntry, 'id' | 'createdAt'>>): Promise<void> {
  await getAdminDb().collection('costs').doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteCost(id: string): Promise<void> {
  await getAdminDb().collection('costs').doc(id).delete();
}
