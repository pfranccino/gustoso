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

export type Settings = {
  waNumber:     string;
  address:      string;
  schedule:     string;
  isOpen:       boolean;
  waGreeting:   string;
  waFooter:     string;
  delivery:     DeliveryConfig;
  mostradorPin: string; // PIN numérico para el modo mostrador
};

export const DEFAULT_DELIVERY: DeliveryConfig = {
  enabled:         false,
  restaurantLat:   0,
  restaurantLng:   0,
  zones:           [{ maxKm: 2, price: 1500 }, { maxKm: 5, price: 2500 }],
  extraPricePerKm: 500,
};
