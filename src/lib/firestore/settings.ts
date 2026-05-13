import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { DeliveryZone, DeliveryConfig, AutoSchedule, Settings } from './settingsTypes';
import { DEFAULT_DELIVERY, DEFAULT_AUTO_SCHEDULE } from './settingsTypes';
export type { DeliveryZone, DeliveryConfig, AutoSchedule, Settings } from './settingsTypes';
export { DEFAULT_DELIVERY, DEFAULT_AUTO_SCHEDULE } from './settingsTypes';

const DEFAULT: Settings = {
  waNumber:     '56985219094',
  address:      'Marino José Manuel Ramírez #1641',
  schedule:     'Lunes a Domingo 12:00 – 22:00',
  isOpen:       true,
  waGreeting:   "Hola Gustoso's! Quiero hacer un pedido 🛒",
  waFooter:     '',
  delivery:     { ...DEFAULT_DELIVERY },
  mostradorPin: '',
  autoSchedule: { ...DEFAULT_AUTO_SCHEDULE },
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

function parseAutoSchedule(raw: unknown): AutoSchedule {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_AUTO_SCHEDULE };
  const s = raw as Record<string, unknown>;
  return {
    enabled:   typeof s.enabled   === 'boolean' ? s.enabled   : false,
    openTime:  typeof s.openTime  === 'string'  ? s.openTime  : '12:00',
    closeTime: typeof s.closeTime === 'string'  ? s.closeTime : '22:00',
    days:      Array.isArray(s.days) ? s.days.filter((d: unknown) => typeof d === 'number') : [0,1,2,3,4,5,6],
  };
}

/** Devuelve true si el horario automático indica que el local está abierto ahora mismo (hora Santiago) */
function computeIsOpen(sched: AutoSchedule, manualIsOpen: boolean): boolean {
  if (!sched.enabled) return manualIsOpen;
  // Hora actual en Santiago (UTC-3 / UTC-4 con DST — usamos Intl)
  const now   = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  const day   = local.getDay();    // 0=Dom
  const hhmm  = local.getHours() * 60 + local.getMinutes();
  const [oh, om] = sched.openTime.split(':').map(Number);
  const [ch, cm] = sched.closeTime.split(':').map(Number);
  const open  = oh * 60 + om;
  const close = ch * 60 + cm;
  return sched.days.includes(day) && hhmm >= open && hhmm < close;
}

export async function getSettings(): Promise<Settings> {
  const doc = await getAdminDb().collection('settings').doc('main').get();
  if (!doc.exists) return { ...DEFAULT };
  const d = doc.data()!;
  const autoSchedule = parseAutoSchedule(d.autoSchedule);
  const manualIsOpen = typeof d.isOpen === 'boolean' ? d.isOpen : DEFAULT.isOpen;
  return {
    waNumber:     typeof d.waNumber     === 'string'  ? d.waNumber     : DEFAULT.waNumber,
    address:      typeof d.address      === 'string'  ? d.address      : DEFAULT.address,
    schedule:     typeof d.schedule     === 'string'  ? d.schedule     : DEFAULT.schedule,
    isOpen:       computeIsOpen(autoSchedule, manualIsOpen),
    waGreeting:   typeof d.waGreeting   === 'string'  ? d.waGreeting   : DEFAULT.waGreeting,
    waFooter:     typeof d.waFooter     === 'string'  ? d.waFooter     : DEFAULT.waFooter,
    delivery:     parseDelivery(d.delivery),
    mostradorPin: typeof d.mostradorPin === 'string'  ? d.mostradorPin : DEFAULT.mostradorPin,
    autoSchedule,
  };
}

export async function updateSettings(update: Partial<Settings>): Promise<void> {
  await getAdminDb().collection('settings').doc('main').set(
    { ...update, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
