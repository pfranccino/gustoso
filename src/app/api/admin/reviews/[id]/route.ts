import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { updateReview, deleteReview } from '@/lib/firestore/reviews';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name    === 'string')  update.name    = body.name.trim();
    if (typeof body.text    === 'string')  update.text    = body.text.trim();
    if (typeof body.stars   === 'number')  update.stars   = Math.min(5, Math.max(1, body.stars));
    if (typeof body.visible === 'boolean') update.visible = body.visible;
    if (typeof body.sortOrder === 'number') update.sortOrder = body.sortOrder;
    await updateReview(params.id, update);
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
    await deleteReview(params.id);
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
