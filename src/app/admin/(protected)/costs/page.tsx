import { getCosts } from '@/lib/firestore/costs';
import { CostEntry } from '@/lib/firestore/costsTypes';
import CostsEditor from '@/components/CostsEditor';

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  let costs: CostEntry[] = [];
  try { costs = await getCosts(); } catch {}

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Costos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Registra compras de insumos. Ingresa cantidad y precio total — el precio unitario se calcula solo.
        </p>
      </div>
      <CostsEditor initial={costs} />
    </div>
  );
}
