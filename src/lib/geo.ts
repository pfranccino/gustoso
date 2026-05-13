import { DeliveryConfig } from '@/lib/firestore/settingsTypes';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calcDeliveryFee(distKm: number, cfg: DeliveryConfig): number | null {
  const sorted = [...cfg.zones].sort((a, b) => a.maxKm - b.maxKm);
  const zone = sorted.find(z => distKm <= z.maxKm);
  if (zone) return zone.price;
  if (cfg.extraPricePerKm > 0 && sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    return last.price + Math.ceil(distKm - last.maxKm) * cfg.extraPricePerKm;
  }
  return null;
}
