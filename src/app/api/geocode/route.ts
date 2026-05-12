import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Coords = { lat: number; lng: number; display: string };

async function googleGeocode(q: string): Promise<Coords | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}&language=es&region=CL`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.[0]) return null;
  const { lat, lng } = data.results[0].geometry.location;
  const display = data.results[0].formatted_address;
  return { lat, lng, display };
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('q')?.trim();
  if (!raw) return NextResponse.json({ error: 'q requerido' }, { status: 400 });

  const q = raw.replace(/#/g, '').replace(/\s+/g, ' ').trim();

  try {
    // 1. Con ciudad explícita
    let result = await googleGeocode(`${q}, Los Andes, Chile`);

    // 2. Solo nombre de calle (sin número)
    if (!result) {
      const streetOnly = q.replace(/\d+/g, '').trim();
      result = await googleGeocode(`${streetOnly}, Los Andes, Chile`);
    }

    if (!result) return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Error de geocodificación' }, { status: 500 });
  }
}
