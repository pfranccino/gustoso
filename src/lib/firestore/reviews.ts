import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type Review = {
  id:        string;
  name:      string;
  stars:     number;
  text:      string;
  sortOrder: number;
  visible:   boolean;
};

function parse(id: string, d: FirebaseFirestore.DocumentData): Review {
  return {
    id,
    name:      String(d.name      ?? ''),
    stars:     Math.min(5, Math.max(1, Number(d.stars ?? 5))),
    text:      String(d.text      ?? ''),
    sortOrder: Number(d.sortOrder ?? 0),
    visible:   d.visible !== false,
  };
}

export async function getReviews(): Promise<Review[]> {
  const snap = await getAdminDb().collection('reviews').orderBy('sortOrder').get();
  return snap.docs.map(doc => parse(doc.id, doc.data()));
}

export async function createReview(data: Omit<Review, 'id'>): Promise<string> {
  const ref = await getAdminDb().collection('reviews').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateReview(id: string, data: Partial<Omit<Review, 'id'>>): Promise<void> {
  await getAdminDb().collection('reviews').doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteReview(id: string): Promise<void> {
  await getAdminDb().collection('reviews').doc(id).delete();
}
