import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/verifySession';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try { await verifySession(); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const b64    = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(b64, {
      folder:         'gustosos',
      transformation: [{ width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
