import AppShell from '@/components/AppShell';
import { getSettings, Settings } from '@/lib/firestore/settings';
import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';
import { getBurritoConfig, BurritoConfig, DEFAULT_BURRITO } from '@/lib/firestore/burritoConfig';
import { getPromotions, Promotion } from '@/lib/firestore/promotions';
import { getAderezos } from '@/lib/firestore/aderezos';
import { Aderezo } from '@/lib/firestore/aderezosTypes';

export const revalidate = 60;

import { DEFAULT_DELIVERY } from '@/lib/firestore/settings';

const DEFAULT_SETTINGS: Settings = {
  waNumber:   '56985219094',
  address:    'Marino José Manuel Ramírez #1641',
  isOpen:     true,
  schedule:   'Lunes a Domingo 12:00 – 22:00',
  waGreeting: "Hola Gustoso's! Quiero hacer un pedido 🛒",
  waFooter:   '',
  delivery:   { ...DEFAULT_DELIVERY },
};

export default async function Home() {
  let settings: Settings           = DEFAULT_SETTINGS;
  let menuItems: MenuItem[]        = [];
  let burritoConfig: BurritoConfig = DEFAULT_BURRITO;
  let promotions: Promotion[]      = [];
  let aderezos: Aderezo[]          = [];
  try {
    [settings, menuItems, burritoConfig, promotions, aderezos] = await Promise.all([
      getSettings(), getMenuItems(), getBurritoConfig(), getPromotions(), getAderezos(),
    ]);
  } catch {}
  return <AppShell settings={settings} menuItems={menuItems} burritoConfig={burritoConfig} promotions={promotions} aderezos={aderezos} />;
}
