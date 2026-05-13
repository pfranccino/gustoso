import { getDiscountCodes, DiscountCode } from '@/lib/firestore/discountCodes';
import DiscountsEditor from '@/components/DiscountsEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function DiscountsPage() {
  let codes: DiscountCode[] = [];
  try { codes = await getDiscountCodes(); } catch {}

  const now    = new Date();
  const active = codes.filter(c => c.active && (!c.expiresAt || new Date(c.expiresAt) > now) && (!c.maxUses || c.usedCount < c.maxUses)).length;

  return (
    <div>
      <AdminHeader
        title="Descuentos"
        subtitle={`${codes.length} código${codes.length !== 1 ? 's' : ''} · ${active} activo${active !== 1 ? 's' : ''}`}
      />
      <DiscountsEditor initial={codes} />
    </div>
  );
}
