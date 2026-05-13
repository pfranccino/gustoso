import { getAderezos } from '@/lib/firestore/aderezos';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import AderezosEditor from '@/components/AderezosEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AderezosPage() {
  let aderezos: Aderezo[] = [];
  try { aderezos = await getAderezos(); } catch {}

  const available = aderezos.filter(a => a.available).length;

  return (
    <div>
      <AdminHeader
        title="Aderezos"
        subtitle={`${available} disponible${available !== 1 ? 's' : ''} de ${aderezos.length} · Precio 0 = gratis`}
      />
      <AderezosEditor initial={aderezos} />
    </div>
  );
}
