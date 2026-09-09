import { describe, it, expect } from 'vitest';
import { parseLatLng, nearestNeighbor, totalDistance, buildMapsUrl, type LatLng } from '@/lib/routeOptimizer';

describe('parseLatLng', () => {
  it('extrae lat/lng de una URL de Google Maps', () => {
    expect(parseLatLng('https://maps.google.com/?q=-32.8534,-70.5940')).toEqual({ lat: -32.8534, lng: -70.594 });
  });

  it('funciona con coordenadas positivas', () => {
    expect(parseLatLng('https://maps.google.com/?q=40.7128,74.0060')).toEqual({ lat: 40.7128, lng: 74.006 });
  });

  it('devuelve null si no hay parámetro q', () => {
    expect(parseLatLng('https://maps.google.com/place/Los+Andes')).toBeNull();
  });

  it('devuelve null para string vacío', () => {
    expect(parseLatLng('')).toBeNull();
  });
});

describe('nearestNeighbor', () => {
  const origin: LatLng = { lat: 0, lng: 0 };

  it('ruta vacía para sin paradas', () => {
    expect(nearestNeighbor(origin, [])).toEqual([]);
  });

  it('no muta el array de entrada', () => {
    const stops: LatLng[] = [{ lat: 0, lng: 2 }, { lat: 0, lng: 1 }];
    const copy = [...stops];
    nearestNeighbor(origin, stops);
    expect(stops).toEqual(copy);
  });

  it('ordena por cercanía greedy desde el origen', () => {
    // Puntos sobre una línea; el greedy debe ir 1 → 2 → 3 → 4
    const stops = [
      { id: '4', lat: 0, lng: 4 },
      { id: '1', lat: 0, lng: 1 },
      { id: '3', lat: 0, lng: 3 },
      { id: '2', lat: 0, lng: 2 },
    ];
    const route = nearestNeighbor(origin, stops);
    expect(route.map(s => s.id)).toEqual(['1', '2', '3', '4']);
  });

  it('conserva todas las paradas exactamente una vez', () => {
    const stops = [
      { id: 'a', lat: 0.01, lng: 0.05 },
      { id: 'b', lat: -0.02, lng: 0.01 },
      { id: 'c', lat: 0.03, lng: -0.04 },
    ];
    const route = nearestNeighbor(origin, stops);
    expect(route).toHaveLength(3);
    expect(new Set(route.map(s => s.id))).toEqual(new Set(['a', 'b', 'c']));
  });

  it('elige primero la parada más cercana al origen', () => {
    const stops = [
      { id: 'lejos', lat: 0, lng: 10 },
      { id: 'cerca', lat: 0, lng: 0.5 },
    ];
    expect(nearestNeighbor(origin, stops)[0].id).toBe('cerca');
  });
});

describe('totalDistance', () => {
  const origin: LatLng = { lat: 0, lng: 0 };

  it('es 0 para ruta vacía', () => {
    expect(totalDistance(origin, [])).toBe(0);
  });

  it('suma los tramos origen→p1→p2…', () => {
    // 1 grado ≈ 111.19 km; origen→(1,0)→(2,0) = ~2 grados
    const d = totalDistance(origin, [{ lat: 1, lng: 0 }, { lat: 2, lng: 0 }]);
    expect(d).toBeCloseTo(111.19 * 2, 0);
  });

  it('la ruta optimizada nunca es más larga que el orden original (en línea)', () => {
    const stops = [
      { lat: 0, lng: 4 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 3 },
      { lat: 0, lng: 2 },
    ];
    const optimized = totalDistance(origin, nearestNeighbor(origin, stops));
    const naive = totalDistance(origin, stops);
    expect(optimized).toBeLessThanOrEqual(naive);
  });
});

describe('buildMapsUrl', () => {
  const origin: LatLng = { lat: -32.85, lng: -70.59 };

  it('una sola parada → sin waypoints, esa parada es el destino', () => {
    const url = buildMapsUrl(origin, [{ lat: -32.82, lng: -70.61 }]);
    expect(url).toContain('origin=-32.85,-70.59');
    expect(url).toContain('destination=-32.82,-70.61');
    expect(url).not.toContain('waypoints=');
  });

  it('varias paradas → última es destino, intermedias son waypoints', () => {
    const url = buildMapsUrl(origin, [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ]);
    expect(url).toContain('destination=3,3');
    expect(url).toContain('waypoints=1,1|2,2');
  });

  it('incluye travelmode=driving', () => {
    const url = buildMapsUrl(origin, [{ lat: 1, lng: 1 }]);
    expect(url).toContain('travelmode=driving');
  });
});
