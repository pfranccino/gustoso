import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/verifySession';
import { getGalleryItems, createGalleryItem } from '@/lib/firestore/gallery';

export const dynamic = 'force-dynamic';

export async function GET() {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await getGalleryItems());
}

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { title, imageUrl, sortOrder } = await request.json();
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    const id = await createGalleryItem({
      title:     title?.trim() ?? '',
      imageUrl,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    });
    revalidatePath('/');
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
