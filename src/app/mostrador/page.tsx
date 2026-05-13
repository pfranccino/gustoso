import AppShell from '@/components/AppShell';
import { getSettings, Settings } from '@/lib/firestore/settings';
import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';
import { getBurritoConfig, BurritoConfig, DEFAULT_BURRITO } from '@/lib/firestore/burritoConfig';
import { getPromotions, Promotion } from '@/lib/firestore/promotions';
import { getAderezos } from '@/lib/firestore/aderezos';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import { getDisabledIngredients } from '@/lib/firestore/ingredientStatus';
import { getGalleryItems, GalleryItem } from '@/lib/firestore/gallery';
import { getReviews, Review } from '@/lib/firestore/reviews';

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

export default async function MostradorPage() {
  let settings: Settings            = DEFAULT_SETTINGS;
  let menuItems: MenuItem[]         = [];
  let burritoConfig: BurritoConfig  = DEFAULT_BURRITO;
  let promotions: Promotion[]       = [];
  let aderezos: Aderezo[]           = [];
  let disabledIngredients: string[] = [];
  let galleryItems: GalleryItem[]   = [];
  let reviewItems:  Review[]        = [];
  try {
    [settings, menuItems, burritoConfig, promotions, aderezos, disabledIngredients, galleryItems, reviewItems] = await Promise.all([
      getSettings(), getMenuItems(), getBurritoConfig(), getPromotions(), getAderezos(), getDisabledIngredients(), getGalleryItems(), getReviews(),
    ]);
  } catch {}
  return <AppShell settings={settings} menuItems={menuItems} burritoConfig={burritoConfig} promotions={promotions} aderezos={aderezos} disabledIngredients={disabledIngredients} galleryItems={galleryItems} reviewItems={reviewItems} mostrador />;
}
