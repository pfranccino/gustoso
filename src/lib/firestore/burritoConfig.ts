import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type BurritoItem    = { name: string; price: number; visible: boolean };
export type BurritoProtein = { name: string; normal: number; xl: number; visible: boolean };

export type BurritoConfig = {
  rellenos:    BurritoItem[];
  proteinas:   BurritoProtein[];
  toppings:    BurritoItem[];
  salsas:      BurritoItem[];
  adicionales: BurritoItem[];
};

/** Convierte tanto el formato antiguo (string) como el nuevo (objeto) */
function parseItem(val: unknown): BurritoItem {
  if (typeof val === 'string') return { name: val, price: 0, visible: true };
  const v = val as Record<string, unknown>;
  return {
    name:    String(v.name    ?? ''),
    price:   Number(v.price   ?? 0),
    visible: v.visible !== false,
  };
}

function parseProtein(val: unknown): BurritoProtein {
  const v = (val ?? {}) as Record<string, unknown>;
  return {
    name:    String(v.name   ?? ''),
    normal:  Number(v.normal ?? 0),
    xl:      Number(v.xl     ?? 0),
    visible: v.visible !== false,
  };
}

export const DEFAULT_BURRITO: BurritoConfig = {
  rellenos: [
    { name:'Arroz Blanco',              price:0, visible:true },
    { name:'Veggie (Pimiento-Cebolla)', price:0, visible:true },
    { name:'Arroz Especial',            price:0, visible:true },
    { name:'Papas Fritas',              price:0, visible:true },
  ],
  proteinas: [
    { name:'Pollo Frito',      normal:5800, xl:9000, visible:true },
    { name:'Birria (Mechada)', normal:6800, xl:9800, visible:true },
    { name:'Carne',            normal:6500, xl:9500, visible:true },
    { name:'Camarón',          normal:6700, xl:9700, visible:true },
    { name:'Al Pastor',        normal:6000, xl:9000, visible:true },
  ],
  toppings: [
    'Choclo','Jalapeño','Queso','Pico Gallo','Palta','Coleslaw','Lechuga',
    'Pepinillo','Cebolla','Cilantro','Tomate','Chips de Maíz','Poroto Verde',
    'Ají Verde','Frijoles',
  ].map(name => ({ name, price: 0, visible: true })),
  salsas: [
    'Crema Agria','Salsa de Queso','Buffalo','Burrera','BBQ',
    'Mayonesa','Mayonesa Picante','Guacamole',
  ].map(name => ({ name, price: 0, visible: true })),
  adicionales: [],
};

export async function getBurritoConfig(): Promise<BurritoConfig> {
  const doc = await getAdminDb().collection('burrito_config').doc('main').get();
  if (!doc.exists) return { ...DEFAULT_BURRITO };
  const d = doc.data()!;

  return {
    rellenos:  Array.isArray(d.rellenos)  ? d.rellenos.map(parseItem)    : DEFAULT_BURRITO.rellenos,
    proteinas: Array.isArray(d.proteinas) ? d.proteinas.map(parseProtein) : DEFAULT_BURRITO.proteinas,
    toppings:    Array.isArray(d.toppings)    ? d.toppings.map(parseItem)    : DEFAULT_BURRITO.toppings,
    salsas:      Array.isArray(d.salsas)      ? d.salsas.map(parseItem)      : DEFAULT_BURRITO.salsas,
    adicionales: Array.isArray(d.adicionales) ? d.adicionales.map(parseItem) : DEFAULT_BURRITO.adicionales,
  };
}

export async function updateBurritoConfig(config: BurritoConfig): Promise<void> {
  await getAdminDb().collection('burrito_config').doc('main').set(
    { ...config, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}
