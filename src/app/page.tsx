import AppShell from '@/components/AppShell';
import { getSettings, Settings } from '@/lib/firestore/settings';
import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';

export const revalidate = 60;

const DEFAULT_SETTINGS: Settings = {
  waNumber:   '56985219094',
  address:    'Marino José Manuel Ramírez #1641',
  isOpen:     true,
  schedule:   'Lunes a Domingo 12:00 – 22:00',
  waGreeting: "Hola Gustoso's! Quiero hacer un pedido 🛒",
  waFooter:   '',
};

export default async function Home() {
  let settings: Settings = DEFAULT_SETTINGS;
  let menuItems: MenuItem[] = [];
  try {
    [settings, menuItems] = await Promise.all([getSettings(), getMenuItems()]);
  } catch {}
  return <AppShell settings={settings} menuItems={menuItems} />;
}
