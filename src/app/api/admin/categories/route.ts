import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import { getCategories, updateCategories } from '@/lib/firestore/categories';
import type { Category } from '@/lib/firestore/categories';

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items = await getCategories();
  return NextResponse.json(items);
}

export async function PUT(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const items: Category[] = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  await updateCategories(items);
  return NextResponse.json({ ok: true });
}
