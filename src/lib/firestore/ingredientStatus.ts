import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type IngredientStatus = {
  name:      string;
  available: boolean;
};

export async function getIngredientStatuses(): Promise<IngredientStatus[]> {
  const snap = await getAdminDb().collection('ingredient_status').get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      name:      typeof d.name      === 'string'  ? d.name      : doc.id,
      available: typeof d.available === 'boolean' ? d.available : true,
    };
  });
}

export async function setIngredientStatus(name: string, available: boolean): Promise<void> {
  await getAdminDb().collection('ingredient_status').doc(name).set(
    { name, available, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

/** Devuelve set de nombres deshabilitados — para uso rápido en el cliente */
export async function getDisabledIngredients(): Promise<string[]> {
  const snap = await getAdminDb()
    .collection('ingredient_status')
    .where('available', '==', false)
    .get();
  return snap.docs.map(doc => doc.data().name as string);
}
