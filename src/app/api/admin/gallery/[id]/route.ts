import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { updateGalleryItem, deleteGalleryItem } from '@/lib/firestore/gallery';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.title     === 'string') update.title     = body.title.trim();
    if (typeof body.imageUrl  === 'string') update.imageUrl  = body.imageUrl;
    if (typeof body.sortOrder === 'number') update.sortOrder = body.sortOrder;
    await updateGalleryItem(params.id, update);
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await deleteGalleryItem(params.id);
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
