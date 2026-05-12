import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type PromoChoice = {
  label:     string;
  category?: string | null;  // si está, las opciones vienen del menú en tiempo real
  options:   string[];       // opciones manuales (usadas cuando no hay category)
  required:  boolean;
};

export type Promotion = {
  id: string;
  name: string;
  description: string;
  price: number;
  badge: string;        // e.g. "PROMO", "OFERTA", "NUEVO", ""
  imageUrl: string | null;
  visible: boolean;
  sortOrder: number;
  choices: PromoChoice[];
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
    choices:     Array.isArray(d.choices)
      ? d.choices.map((c: Record<string, unknown>) => ({
          label:    String(c.label    ?? ''),
          category: typeof c.category === 'string' ? c.category : null,
          options:  Array.isArray(c.options) ? c.options.map(String) : [],
          required: c.required !== false,
        }))
      : [],
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
