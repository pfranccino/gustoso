import AppShell from '@/components/AppShell';
import { getSettings, Settings } from '@/lib/firestore/settings';

export const revalidate = 60;

const DEFAULT: Settings = {
  waNumber: '56985219094',
  address:  'Marino José Manuel Ramírez #1641',
  isOpen:   true,
  schedule: 'Lunes a Domingo 12:00 – 22:00',
};

export default async function Home() {
  let settings: Settings = DEFAULT;
  try {
    settings = await getSettings();
  } catch {}
  return <AppShell settings={settings} />;
}
