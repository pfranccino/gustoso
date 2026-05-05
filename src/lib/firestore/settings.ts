import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type Settings = {
  waNumber: string;
  address: string;
  schedule: string;
  isOpen: boolean;
};

const DEFAULT: Settings = {
  waNumber: '56985219094',
  address:  'Marino José Manuel Ramírez #1641',
  schedule: 'Lunes a Domingo 12:00 – 22:00',
  isOpen:   true,
};

export async function getSettings(): Promise<Settings> {
  const doc = await getAdminDb().collection('settings').doc('main').get();
  if (!doc.exists) return { ...DEFAULT };
  const d = doc.data()!;
  return {
    waNumber: typeof d.waNumber === 'string' ? d.waNumber : DEFAULT.waNumber,
    address:  typeof d.address  === 'string' ? d.address  : DEFAULT.address,
    schedule: typeof d.schedule === 'string' ? d.schedule : DEFAULT.schedule,
    isOpen:   typeof d.isOpen   === 'boolean'? d.isOpen   : DEFAULT.isOpen,
  };
}

export async function updateSettings(update: Partial<Settings>): Promise<void> {
  await getAdminDb().collection('settings').doc('main').set(
    { ...update, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
