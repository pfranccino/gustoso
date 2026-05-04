import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { MENU_DATA, BURRITO_DATA } from '@/lib/menuData';

export async function seedMenuIfEmpty(): Promise<{ seeded: boolean; count: number }> {
  const db = getAdminDb();
  const existing = await db.collection('menu_items').limit(1).get();
  if (!existing.empty) return { seeded: false, count: 0 };

  const batch = db.batch();
  let count = 0;

  for (const [category, data] of [
    ['vienesas', MENU_DATA.vienesas] as const,
    ['as',       MENU_DATA.as]       as const,
  ]) {
    data.items.forEach((item, i) => {
      const slug = `${category}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      batch.set(db.collection('menu_items').doc(slug), {
        category,
        name:        item.name,
        desc:        item.desc ?? null,
        price:       item.price,
        priceNormal: null,
        priceXL:     null,
        imageUrl:    null,
        visible:     true,
        sortOrder:   i,
        updatedAt:   FieldValue.serverTimestamp(),
      });
      count++;
    });
  }

  for (const [category, data] of [
    ['churrasco', MENU_DATA.churrasco] as const,
    ['mechada',   MENU_DATA.mechada]   as const,
  ]) {
    data.items.forEach((item, i) => {
      const slug = `${category}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      batch.set(db.collection('menu_items').doc(slug), {
        category,
        name:        item.name,
        desc:        item.desc ?? null,
        price:       null,
        priceNormal: item.priceNormal,
        priceXL:     item.priceXL,
        imageUrl:    null,
        visible:     true,
        sortOrder:   i,
        updatedAt:   FieldValue.serverTimestamp(),
      });
      count++;
    });
  }

  MENU_DATA.papas.groups.forEach(group => {
    group.items.forEach((item, i) => {
      const slug = `papas-${group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      batch.set(db.collection('menu_items').doc(slug), {
        category:    'papas',
        group:       group.name,
        name:        item.name,
        desc:        item.desc ?? null,
        price:       item.price,
        priceNormal: null,
        priceXL:     null,
        imageUrl:    null,
        visible:     true,
        sortOrder:   i,
        updatedAt:   FieldValue.serverTimestamp(),
      });
      count++;
    });
  });

  const burritoRef = db.collection('burrito_config').doc('main');
  batch.set(burritoRef, { ...BURRITO_DATA, updatedAt: FieldValue.serverTimestamp() });

  await batch.commit();
  return { seeded: true, count };
}
