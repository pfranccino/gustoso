import { describe, it, expect } from 'vitest';
import { haversineKm, calcDeliveryFee } from '@/lib/geo';
import type { DeliveryConfig } from '@/lib/firestore/settingsTypes';

describe('haversineKm', () => {
  it('devuelve 0 para el mismo punto', () => {
    expect(haversineKm(-32.85, -70.59, -32.85, -70.59)).toBe(0);
  });

  it('es simétrica (A→B == B→A)', () => {
    const ab = haversineKm(-32.85, -70.59, -32.82, -70.61);
    const ba = haversineKm(-32.82, -70.61, -32.85, -70.59);
    expect(ab).toBeCloseTo(ba, 10);
  });

  it('calcula una distancia conocida (Los Andes → Santiago ≈ 77 km)', () => {
    // Los Andes centro vs Santiago centro
    const d = haversineKm(-32.8347, -70.5983, -33.4489, -70.6693);
    expect(d).toBeGreaterThan(68);
    expect(d).toBeLessThan(82);
  });

  it('1 grado de latitud ≈ 111 km', () => {
    const d = haversineKm(0, 0, 1, 0);
    expect(d).toBeCloseTo(111.19, 1);
  });

  it('distancias cortas urbanas son de pocos km', () => {
    const d = haversineKm(-32.8534, -70.5940, -32.8600, -70.6000);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(2);
  });
});

/* Config base: 3 zonas + precio por km extra */
function cfg(over: Partial<DeliveryConfig> = {}): DeliveryConfig {
  return {
    enabled: true,
    restaurantLat: -32.8534,
    restaurantLng: -70.5940,
    extraPricePerKm: 500,
    zones: [
      { maxKm: 2, price: 1000 },
      { maxKm: 5, price: 2000 },
      { maxKm: 10, price: 3500 },
    ],
    ...over,
  } as DeliveryConfig;
}

describe('calcDeliveryFee', () => {
  it('toma la primera zona cuya maxKm cubre la distancia', () => {
    expect(calcDeliveryFee(1.5, cfg())).toBe(1000);
    expect(calcDeliveryFee(3, cfg())).toBe(2000);
    expect(calcDeliveryFee(8, cfg())).toBe(3500);
  });

  it('el borde exacto de la zona se incluye (<=)', () => {
    expect(calcDeliveryFee(2, cfg())).toBe(1000);
    expect(calcDeliveryFee(5, cfg())).toBe(2000);
    expect(calcDeliveryFee(10, cfg())).toBe(3500);
  });

  it('ordena las zonas aunque vengan desordenadas', () => {
    const unordered = cfg({
      zones: [
        { maxKm: 10, price: 3500 },
        { maxKm: 2, price: 1000 },
        { maxKm: 5, price: 2000 },
      ],
    });
    expect(calcDeliveryFee(1.5, unordered)).toBe(1000);
    expect(calcDeliveryFee(3, unordered)).toBe(2000);
  });

  it('fuera de zona: suma precio por km extra redondeando km hacia arriba', () => {
    // 12 km: última zona 10 km @ 3500 + ceil(12-10)=2 km * 500 = 4500
    expect(calcDeliveryFee(12, cfg())).toBe(4500);
    // 10.1 km: ceil(0.1)=1 km extra → 3500 + 500 = 4000
    expect(calcDeliveryFee(10.1, cfg())).toBe(4000);
  });

  it('fuera de zona sin precio por km extra → null (no se puede cotizar)', () => {
    expect(calcDeliveryFee(15, cfg({ extraPricePerKm: 0 }))).toBeNull();
  });

  it('sin zonas configuradas → null', () => {
    expect(calcDeliveryFee(1, cfg({ zones: [] }))).toBeNull();
  });
});
