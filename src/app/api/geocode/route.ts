import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Coords = { lat: number; lng: number; display: string };

/* ── Photon (Komoot) — mejor cobertura Latinoamérica ── */
async function photon(q: string): Promise<Coords | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1&lang=es`;
  const res  = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  const [lng, lat] = feat.geometry.coordinates as [number, number];
  const p = feat.properties;
  const display = [p.name, p.street, p.city, p.country].filter(Boolean).join(', ');
  return { lat, lng, display };
}

/* ── Nominatim (fallback) ── */
async function nominatim(q: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=cl`;
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'GustososDelivery/1.0 (pfranccino@gmail.com)' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const { lat, lon, display_name } = data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon), display: display_name };
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('q')?.trim();
  if (!raw) return NextResponse.json({ error: 'q requerido' }, { status: 400 });

  // Quitar '#' (formato chileno) y normalizar espacios
  const q = raw.replace(/#/g, '').replace(/\s+/g, ' ').trim();

  try {
    // 1. Photon con ciudad explícita
    let result = await photon(`${q}, Los Andes, Chile`);

    // 2. Nominatim con ciudad
    if (!result) result = await nominatim(`${q}, Los Andes, Chile`);

    // 3. Solo nombre de calle (sin número)
    if (!result) {
      const streetOnly = q.replace(/\d+/g, '').trim();
      result = await photon(`${streetOnly}, Los Andes, Chile`)
            ?? await nominatim(`${streetOnly}, Los Andes, Chile`);
    }

    if (!result) return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Error de geocodificación' }, { status: 500 });
  }
}
