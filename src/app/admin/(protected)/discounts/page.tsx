import { getDiscountCodes, DiscountCode } from '@/lib/firestore/discountCodes';
import DiscountsEditor from '@/components/DiscountsEditor';

export const dynamic = 'force-dynamic';

export default async function DiscountsPage() {
  let codes: DiscountCode[] = [];
  try { codes = await getDiscountCodes(); } catch {}

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Códigos de descuento
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Crea códigos para clientes: monto fijo o porcentaje, usos limitados y fecha de expiración opcional.
        </p>
      </div>
      <DiscountsEditor initial={codes} />
    </div>
  );
}
