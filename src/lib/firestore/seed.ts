import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { MENU_DATA, BURRITO_DATA } from '@/lib/menuData';

/**
 * Si el desc tiene comas → lista de ingredientes.
 * Si no tiene comas (ej: "5 Empanadas de queso") → es una descripción, no ingredientes.
 */
function splitDesc(desc?: string): { desc: string | null; ingredients: { name: string; enabled: boolean }[] } {
  if (!desc) return { desc: null, ingredients: [] };
  if (desc.includes(',')) {
    const ingredients = desc.split(',').map(s => ({ name: s.trim(), enabled: true })).filter(i => i.name);
    return { desc: null, ingredients };
  }
  return { desc, ingredients: [] };
}

export async function seedMenuIfEmpty(force = false): Promise<{ seeded: boolean; count: number }> {
  const db = getAdminDb();

  if (!force) {
    const existing = await db.collection('menu_items').limit(1).get();
    if (!existing.empty) return { seeded: false, count: 0 };
  } else {
    // Borrar todos los docs existentes primero
    const snap = await db.collection('menu_items').get();
    const delBatch = db.batch();
    snap.docs.forEach(doc => delBatch.delete(doc.ref));
    if (!snap.empty) await delBatch.commit();
  }

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
        ...splitDesc(item.desc),
        extras:      [],
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
        ...splitDesc(item.desc),
        extras:      [],
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

  MENU_DATA.bebidas.items.forEach((item, i) => {
    const slug = `bebidas-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.volume.replace(/[^a-z0-9]+/g, '-')}`;
    batch.set(db.collection('menu_items').doc(slug), {
      category:    'bebidas',
      name:        item.name,
      volume:      item.volume,
      desc:        null,
      ingredients: [],
      extras:      [],
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

  MENU_DATA.papas.groups.forEach(group => {
    group.items.forEach((item, i) => {
      const slug = `papas-${group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      batch.set(db.collection('menu_items').doc(slug), {
        category:    'papas',
        group:       group.name,
        name:        item.name,
        ...splitDesc(item.desc),
        extras:      [],
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
