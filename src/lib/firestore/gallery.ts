import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type GalleryItem = {
  id:        string;
  title:     string;
  imageUrl:  string;
  sortOrder: number;
};

function parse(id: string, d: FirebaseFirestore.DocumentData): GalleryItem {
  return {
    id,
    title:     String(d.title     ?? ''),
    imageUrl:  String(d.imageUrl  ?? ''),
    sortOrder: Number(d.sortOrder ?? 0),
  };
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const snap = await getAdminDb().collection('gallery').orderBy('sortOrder').get();
  return snap.docs.map(doc => parse(doc.id, doc.data()));
}

export async function createGalleryItem(data: Omit<GalleryItem, 'id'>): Promise<string> {
  const ref = await getAdminDb().collection('gallery').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateGalleryItem(id: string, data: Partial<Omit<GalleryItem, 'id'>>): Promise<void> {
  await getAdminDb().collection('gallery').doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await getAdminDb().collection('gallery').doc(id).delete();
}
