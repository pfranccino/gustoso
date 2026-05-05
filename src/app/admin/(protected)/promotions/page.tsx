import { getPromotions, Promotion } from '@/lib/firestore/promotions';
import PromotionsEditor from '@/components/PromotionsEditor';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  let promos: Promotion[] = [];
  try {
    promos = await getPromotions();
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
      <PromotionsEditor initial={promos} />
    </div>
  );
}
