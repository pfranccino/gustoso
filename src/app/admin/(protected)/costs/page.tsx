import { getCosts } from '@/lib/firestore/costs';
import { CostEntry } from '@/lib/firestore/costsTypes';
import CostsEditor from '@/components/CostsEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  let costs: CostEntry[] = [];
  try { costs = await getCosts(); } catch {}

  const insumos = new Set(costs.map(c => c.name)).size;
  const now = new Date();
  const thisMonth = costs.filter(c => {
    const d = new Date(c.date ?? c.createdAt ?? 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, c) => s + (c.totalPrice ?? 0), 0);

  return (
    <div>
      <AdminHeader
        title="Costos"
        subtitle={`${insumos} insumo${insumos !== 1 ? 's' : ''} · ${monthTotal > 0 ? `$${monthTotal.toLocaleString('es-CL')} este mes` : 'sin compras este mes'}`}
      />
      <CostsEditor initial={costs} />
    </div>
  );
}
