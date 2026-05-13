import { getMenuItems, MenuItem } from '@/lib/firestore/menuItems';
import { getCategories, getCategoriesUpdatedAt } from '@/lib/firestore/categories';
import type { Category } from '@/lib/firestore/categories';
import MenuEditor from '@/components/MenuEditor';
import CategoryManager from '@/components/CategoryManager';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

function LastEdited({ iso }: { iso: string | null }) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  let label: string;
  if (diffMin < 1)       label = 'hace un momento';
  else if (diffMin < 60) label = `hace ${diffMin} min`;
  else if (diffMin < 1440) {
    const h = Math.floor(diffMin / 60);
    label = `hace ${h}h`;
  } else {
    label = d.toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  }
  return (
    <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>
      · Última edición: {label}
    </span>
  );
}

export default async function AdminMenuPage() {
  let items: MenuItem[]       = [];
  let categories: Category[]  = [];
  let updatedAt: string | null = null;

  try {
    [items, categories, updatedAt] = await Promise.all([
      getMenuItems(),
      getCategories(),
      getCategoriesUpdatedAt(),
    ]);
  } catch {
    /* Firestore no disponible — editor mostrará vacío con botón seed */
  }

  const visibleCount = items.filter(i => i.visible).length;
  const hiddenCount  = items.length - visibleCount;

  return (
    <div>
      <AdminHeader
        title="Menú"
        subtitle={<>{visibleCount} productos{hiddenCount > 0 && ` · ${hiddenCount} ocultos`}<LastEdited iso={updatedAt}/></>}
      />

      <CategoryManager initial={categories}/>
      <MenuEditor initialItems={items} categories={categories}/>
    </div>
  );
}
