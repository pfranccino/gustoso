import { haversineKm } from '@/lib/geo';

export type LatLng = { lat: number; lng: number };

/** Extrae lat/lng de una URL de Google Maps tipo `...?q=-32.85,-70.59`. */
export function parseLatLng(url: string): LatLng | null {
  const m = url.match(/q=([-\d.]+),([-\d.]+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * Nearest-neighbor TSP heurístico partiendo desde `origin`.
 * Ordena las paradas minimizando (de forma greedy) la distancia al siguiente
 * punto más cercano. O(n²), suficiente para rutas de hasta ~20 paradas.
 * No muta `stops`.
 */
export function nearestNeighbor<T extends LatLng>(origin: LatLng, stops: T[]): T[] {
  const remaining = [...stops];
  const route: T[] = [];
  let current: LatLng = origin;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = haversineKm(current.lat, current.lng, remaining[0].lat, remaining[0].lng);
    for (let i = 1; i < remaining.length; i++) {
      const d = haversineKm(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    route.push(next);
    current = next;
  }
  return route;
}

/** Distancia total (km) recorriendo `route` en orden desde `origin`. */
export function totalDistance(origin: LatLng, route: LatLng[]): number {
  let dist = 0;
  let prev: LatLng = origin;
  for (const stop of route) {
    dist += haversineKm(prev.lat, prev.lng, stop.lat, stop.lng);
    prev = stop;
  }
  return dist;
}

/**
 * URL de Google Maps con origen + waypoints + destino explícitos.
 * El formato explícito evita que Maps reordene o ponga el local al final.
 */
export function buildMapsUrl(origin: LatLng, route: LatLng[]): string {
  const coords  = route.map(s => `${s.lat},${s.lng}`);
  const originS = `${origin.lat},${origin.lng}`;
  const dest    = coords[coords.length - 1];
  const wps     = coords.slice(0, -1).join('|');
  const base    = `https://www.google.com/maps/dir/?api=1&origin=${originS}&destination=${dest}&travelmode=driving`;
  return wps ? `${base}&waypoints=${wps}` : base;
}
