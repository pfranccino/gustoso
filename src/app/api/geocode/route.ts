import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HEADERS = { 'User-Agent': 'GustososDelivery/1.0 (pfranccino@gmail.com)' };

async function nominatim(q: string): Promise<{ lat: number; lng: number; display: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=cl`;
  const res  = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const { lat, lon, display_name } = data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon), display: display_name };
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('q')?.trim();
  if (!raw) return NextResponse.json({ error: 'q requerido' }, { status: 400 });

  // Normalizar: quitar '#' (formato chileno) y dobles espacios
  const q = raw.replace(/#/g, '').replace(/\s+/g, ' ').trim();

  try {
    // Intento 1: query tal como viene + Los Andes, Chile
    let result = await nominatim(`${q}, Los Andes, Chile`);

    // Intento 2: sin número de calle (solo nombre de calle + ciudad)
    if (!result) {
      const streetOnly = q.replace(/\d+/g, '').trim();
      result = await nominatim(`${streetOnly}, Los Andes, Chile`);
    }

    if (!result) return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Error de geocodificación' }, { status: 500 });
  }
}
