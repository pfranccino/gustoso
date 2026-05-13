import { getPromotions, Promotion } from '@/lib/firestore/promotions';
import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';
import PromotionsEditor from '@/components/PromotionsEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  let promos: Promotion[] = [];
  let menuItems: MenuItem[] = [];
  try {
    [promos, menuItems] = await Promise.all([getPromotions(), getMenuItems()]);
  } catch {}

  const active  = promos.filter(p => p.visible).length;
  const hidden  = promos.length - active;

  return (
    <div>
      <AdminHeader
        title="Promociones"
        subtitle={`${active} activa${active !== 1 ? 's' : ''}${hidden > 0 ? ` · ${hidden} oculta${hidden !== 1 ? 's' : ''}` : ''}`}
        isLive={active > 0}
      />
      <PromotionsEditor initial={promos} menuItems={menuItems} />
    </div>
  );
}
