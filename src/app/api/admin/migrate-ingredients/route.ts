import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifySession } from '@/lib/auth/verifySession';

export const dynamic = 'force-dynamic';

export async function POST() {
  await verifySession();

  const db   = getAdminDb();
  const snap = await db.collection('menu_items').get();

  // Firestore batch limit = 500 ops; the menu is small so one batch is fine
  const batch = db.batch();
  let migrated = 0;
  let skipped  = 0;

  snap.docs.forEach(doc => {
    const d = doc.data();
    const desc: string | null = d.desc ?? null;
    const existing: string[]  = Array.isArray(d.ingredients) ? d.ingredients : [];

    // Only migrate docs that still have a desc and no ingredients yet
    if (desc && existing.length === 0) {
      const ingredients = desc.split(',').map((s: string) => s.trim()).filter(Boolean);
      batch.update(doc.ref, { ingredients, desc: null });
      migrated++;
    } else {
      skipped++;
    }
  });

  await batch.commit();
  return NextResponse.json({ migrated, skipped });
}
