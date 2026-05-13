/**
 * Tipos y defaults de Settings — sin imports de servidor.
 * Pueden importarse desde componentes cliente ('use client') con seguridad.
 */

export type DeliveryZone = { maxKm: number; price: number };

export type DeliveryConfig = {
  enabled:         boolean;
  restaurantLat:   number;
  restaurantLng:   number;
  zones:           DeliveryZone[];
  extraPricePerKm: number;
};

export type AutoSchedule = {
  enabled:   boolean;
  openTime:  string;   // "HH:MM" hora apertura
  closeTime: string;   // "HH:MM" hora cierre
  days:      number[]; // 0=Dom, 1=Lun … 6=Sáb
};

export const DEFAULT_AUTO_SCHEDULE: AutoSchedule = {
  enabled:   false,
  openTime:  '12:00',
  closeTime: '22:00',
  days:      [0, 1, 2, 3, 4, 5, 6],
};

export type Settings = {
  waNumber:     string;
  address:      string;
  schedule:     string;
  isOpen:       boolean;
  waGreeting:   string;
  waFooter:     string;
  delivery:     DeliveryConfig;
  mostradorPin: string;
  autoSchedule: AutoSchedule;
};

export const DEFAULT_DELIVERY: DeliveryConfig = {
  enabled:         false,
  restaurantLat:   0,
  restaurantLng:   0,
  zones:           [{ maxKm: 2, price: 1500 }, { maxKm: 5, price: 2500 }],
  extraPricePerKm: 500,
};
