import { getBurritoConfig } from '@/lib/firestore/burritoConfig';
import BurritoEditor from '@/components/BurritoEditor';
import AdminHeader from '@/components/admin/AdminHeader';

export const dynamic = 'force-dynamic';

export default async function BurritoPage() {
  const config = await getBurritoConfig();
  const totalOpts = (config.rellenos?.length ?? 0) + (config.proteinas?.length ?? 0) + (config.toppings?.length ?? 0) + (config.salsas?.length ?? 0);
  return (
    <div>
      <AdminHeader
        title="Burrito"
        subtitle={`${totalOpts} opciones · rellenos, proteínas, toppings y salsas`}
      />
      <BurritoEditor initial={config} />
    </div>
  );
}
