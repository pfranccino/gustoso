import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { getReviews, createReview } from '@/lib/firestore/reviews';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await getReviews());
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, stars, text, sortOrder, visible } = await request.json();
    if (!name?.trim() || !text?.trim()) return NextResponse.json({ error: 'name y text requeridos' }, { status: 400 });
    const id = await createReview({
      name:      name.trim(),
      stars:     Math.min(5, Math.max(1, Number(stars) || 5)),
      text:      text.trim(),
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      visible:   visible !== false,
    });
    revalidatePath('/');
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
