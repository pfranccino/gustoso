import { getBurritoConfig } from '@/lib/firestore/burritoConfig';
import BurritoEditor from '@/components/BurritoEditor';

export const dynamic = 'force-dynamic';

export default async function BurritoPage() {
  const config = await getBurritoConfig();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginBottom:4 }}>
          🌯 Burrito
        </h1>
        <p style={{ fontSize:14, color:'var(--text-muted)' }}>
          Gestiona rellenos, proteínas, toppings y salsas disponibles.
        </p>
      </div>
      <BurritoEditor initial={config} />
    </div>
  );
}
