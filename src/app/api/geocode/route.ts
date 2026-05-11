import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ error: 'q requerido' }, { status: 400 });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=cl`;
    const res  = await fetch(url, {
      headers: { 'User-Agent': 'GustososDelivery/1.0 (pfranccino@gmail.com)' },
      next: { revalidate: 0 },
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0)
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });

    const { lat, lon, display_name } = data[0];
    return NextResponse.json({
      lat:     parseFloat(lat),
      lng:     parseFloat(lon),
      display: display_name,
    });
  } catch {
    return NextResponse.json({ error: 'Error de geocodificación' }, { status: 500 });
  }
}
