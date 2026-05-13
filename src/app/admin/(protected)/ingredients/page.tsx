import { getMenuItems } from '@/lib/firestore/menuItems';
import { getIngredientStatuses, IngredientStatus } from '@/lib/firestore/ingredientStatus';
import IngredientsStatusEditor from '@/components/IngredientsStatusEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function IngredientsPage() {
  const [items, statuses] = await Promise.all([getMenuItems(), getIngredientStatuses()]);

  const allNames = Array.from(
    new Set(items.flatMap(item => item.ingredients.filter(i => i.enabled).map(i => i.name)))
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const statusMap = Object.fromEntries(statuses.map(s => [s.name, s.available]));
  const combined: IngredientStatus[] = allNames.map(name => ({
    name,
    available: statusMap[name] !== undefined ? statusMap[name] : true,
  }));

  const unavailable = combined.filter(i => !i.available).length;

  return (
    <div>
      <AdminHeader
        title="Ingredientes"
        subtitle={unavailable > 0 ? `${unavailable} no disponible${unavailable !== 1 ? 's' : ''} · aparecen tachados en el menú` : `Todos los ingredientes disponibles · ${combined.length} en total`}
        isLive={unavailable === 0}
      />
      <IngredientsStatusEditor ingredients={combined} />
    </div>
  );
}
