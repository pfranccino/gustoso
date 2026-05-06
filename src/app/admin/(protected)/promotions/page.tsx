import { getPromotions, Promotion } from '@/lib/firestore/promotions';
import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';
import PromotionsEditor from '@/components/PromotionsEditor';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  let promos: Promotion[] = [];
  let menuItems: MenuItem[] = [];
  try {
    [promos, menuItems] = await Promise.all([getPromotions(), getMenuItems()]);
  } catch {}

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Promociones
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Crea y gestiona combos y ofertas especiales. Aparecen en la pestaña &quot;Promos&quot; del menú.
        </p>
      </div>
      <PromotionsEditor initial={promos} menuItems={menuItems} />
    </div>
  );
}
