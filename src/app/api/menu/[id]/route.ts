import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { updateMenuItem, deleteMenuItem, MenuItemUpdate } from '@/lib/firestore/menuItems';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let body: MenuItemUpdate;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed: (keyof MenuItemUpdate)[] = ['name', 'desc', 'price', 'priceNormal', 'priceXL', 'visible', 'imageUrl', 'extras'];
  const update: MenuItemUpdate = {};
  for (const key of allowed) {
    if (key in body) (update as Record<string, unknown>)[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  try {
    await updateMenuItem(id, update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('menu PATCH error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await deleteMenuItem(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('menu DELETE error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
