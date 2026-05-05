import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type Promotion = {
  id: string;
  name: string;
  description: string;
  price: number;
  badge: string;        // e.g. "PROMO", "OFERTA", "NUEVO", ""
  imageUrl: string | null;
  visible: boolean;
  sortOrder: number;
  items: string[];      // list of what's included: ["Completo italiano", "Bebida 500ml"]
};

export type NewPromotion = Omit<Promotion, 'id'>;
export type PromotionUpdate = Partial<Omit<Promotion, 'id'>>;

function parsePromotion(id: string, d: FirebaseFirestore.DocumentData): Promotion {
  return {
    id,
    name:        String(d.name        ?? ''),
    description: String(d.description ?? ''),
    price:       Number(d.price       ?? 0),
    badge:       String(d.badge       ?? ''),
    imageUrl:    d.imageUrl ?? null,
    visible:     d.visible !== false,
    sortOrder:   Number(d.sortOrder   ?? 0),
    items:       Array.isArray(d.items) ? d.items.map(String) : [],
  };
}

export async function getPromotions(): Promise<Promotion[]> {
  const snap = await getAdminDb().collection('promotions').orderBy('sortOrder').get();
  return snap.docs.map(doc => parsePromotion(doc.id, doc.data()));
}

export async function createPromotion(data: NewPromotion): Promise<string> {
  const countSnap = await getAdminDb().collection('promotions').get();
  const ref = await getAdminDb().collection('promotions').add({
    ...data,
    sortOrder: countSnap.size,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updatePromotion(id: string, update: PromotionUpdate): Promise<void> {
  await getAdminDb().collection('promotions').doc(id).update({
    ...update,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deletePromotion(id: string): Promise<void> {
  await getAdminDb().collection('promotions').doc(id).delete();
}
