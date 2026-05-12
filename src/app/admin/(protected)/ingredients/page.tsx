import { getMenuItems } from '@/lib/firestore/menuItems';
import { getIngredientStatuses, IngredientStatus } from '@/lib/firestore/ingredientStatus';
import IngredientsStatusEditor from '@/components/IngredientsStatusEditor';

export const dynamic = 'force-dynamic';

export default async function IngredientsPage() {
  const [items, statuses] = await Promise.all([getMenuItems(), getIngredientStatuses()]);

  // Recopilar todos los ingredientes únicos de todos los productos
  const allNames = Array.from(
    new Set(
      items.flatMap(item => item.ingredients.filter(i => i.enabled).map(i => i.name))
    )
  ).sort((a, b) => a.localeCompare(b, 'es'));

  // Combinar con los estados guardados
  const statusMap = Object.fromEntries(statuses.map(s => [s.name, s.available]));
  const combined: IngredientStatus[] = allNames.map(name => ({
    name,
    available: statusMap[name] !== undefined ? statusMap[name] : true,
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Ingredientes
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Deshabilita un ingrediente y quedará marcado como no disponible en todos los productos que lo contienen.
        </p>
      </div>
      <IngredientsStatusEditor ingredients={combined} />
    </div>
  );
}
