import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';
import MenuEditor from '@/components/MenuEditor';

export const dynamic = 'force-dynamic';

export default async function AdminMenuPage() {
  let items: MenuItem[] = [];
  try {
    items = await getMenuItems();
  } catch {
    /* Firestore not reachable — editor will show empty with seed button */
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Menú
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Edita precios, descripción y visibilidad de cada ítem.
        </p>
      </div>
      <MenuEditor initialItems={items} />
    </div>
  );
}
