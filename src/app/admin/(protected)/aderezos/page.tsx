import { getAderezos } from '@/lib/firestore/aderezos';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import AderezosEditor from '@/components/AderezosEditor';

export const dynamic = 'force-dynamic';

export default async function AderezosPage() {
  let aderezos: Aderezo[] = [];
  try { aderezos = await getAderezos(); } catch {}

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Aderezos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Opcionales disponibles para todos los pedidos. Precio 0 = gratis.
        </p>
      </div>
      <AderezosEditor initial={aderezos} />
    </div>
  );
}
