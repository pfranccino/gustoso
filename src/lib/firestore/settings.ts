import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type DeliveryZone = { maxKm: number; price: number };

export type DeliveryConfig = {
  enabled:          boolean;
  restaurantLat:    number;
  restaurantLng:    number;
  zones:            DeliveryZone[];  // ordenadas por maxKm ascendente
  extraPricePerKm:  number;          // precio/km más allá de la última zona (0 = no disponible)
};

export const DEFAULT_DELIVERY: DeliveryConfig = {
  enabled:         false,
  restaurantLat:   0,
  restaurantLng:   0,
  zones:           [{ maxKm: 2, price: 1500 }, { maxKm: 5, price: 2500 }],
  extraPricePerKm: 500,
};

export type Settings = {
  waNumber:   string;
  address:    string;
  schedule:   string;
  isOpen:     boolean;
  waGreeting: string;
  waFooter:   string;
  delivery:   DeliveryConfig;
};

const DEFAULT: Settings = {
  waNumber:   '56985219094',
  address:    'Marino José Manuel Ramírez #1641',
  schedule:   'Lunes a Domingo 12:00 – 22:00',
  isOpen:     true,
  waGreeting: "Hola Gustoso's! Quiero hacer un pedido 🛒",
  waFooter:   '',
  delivery:   { ...DEFAULT_DELIVERY },
};

function parseDelivery(raw: unknown): DeliveryConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DELIVERY };
  const d = raw as Record<string, unknown>;
  const zones = Array.isArray(d.zones)
    ? (d.zones as DeliveryZone[]).filter(z => typeof z.maxKm === 'number' && typeof z.price === 'number')
    : DEFAULT_DELIVERY.zones;
  return {
    enabled:         typeof d.enabled         === 'boolean' ? d.enabled         : false,
    restaurantLat:   typeof d.restaurantLat   === 'number'  ? d.restaurantLat   : 0,
    restaurantLng:   typeof d.restaurantLng   === 'number'  ? d.restaurantLng   : 0,
    zones:           zones.length ? zones : DEFAULT_DELIVERY.zones,
    extraPricePerKm: typeof d.extraPricePerKm === 'number'  ? d.extraPricePerKm : 500,
  };
}

export async function getSettings(): Promise<Settings> {
  const doc = await getAdminDb().collection('settings').doc('main').get();
  if (!doc.exists) return { ...DEFAULT };
  const d = doc.data()!;
  return {
    waNumber:   typeof d.waNumber   === 'string'  ? d.waNumber   : DEFAULT.waNumber,
    address:    typeof d.address    === 'string'  ? d.address    : DEFAULT.address,
    schedule:   typeof d.schedule   === 'string'  ? d.schedule   : DEFAULT.schedule,
    isOpen:     typeof d.isOpen     === 'boolean' ? d.isOpen     : DEFAULT.isOpen,
    waGreeting: typeof d.waGreeting === 'string'  ? d.waGreeting : DEFAULT.waGreeting,
    waFooter:   typeof d.waFooter   === 'string'  ? d.waFooter   : DEFAULT.waFooter,
    delivery:   parseDelivery(d.delivery),
  };
}

export async function updateSettings(update: Partial<Settings>): Promise<void> {
  await getAdminDb().collection('settings').doc('main').set(
    { ...update, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
