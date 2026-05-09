import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
export type { Aderezo } from './aderezosTypes';
import type { Aderezo } from './aderezosTypes';

export async function getAderezos(): Promise<Aderezo[]> {
  const snap = await getAdminDb().collection('aderezos').get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id:        doc.id,
      name:      typeof d.name      === 'string'  ? d.name      : '',
      price:     typeof d.price     === 'number'  ? d.price     : 0,
      available: typeof d.available === 'boolean' ? d.available : true,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function createAderezo(data: Omit<Aderezo, 'id'>): Promise<string> {
  const ref = await getAdminDb().collection('aderezos').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateAderezo(id: string, data: Partial<Omit<Aderezo, 'id'>>): Promise<void> {
  await getAdminDb().collection('aderezos').doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteAderezo(id: string): Promise<void> {
  await getAdminDb().collection('aderezos').doc(id).delete();
}
