import { getSettings, Settings, DEFAULT_DELIVERY, DEFAULT_AUTO_SCHEDULE, getSettingsUpdatedAt } from '@/lib/firestore/settings';
import SettingsEditor from '@/components/SettingsEditor';

export const dynamic = 'force-dynamic';

function LastEdited({ iso }: { iso: string | null }) {
  if (!iso) return null;
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  let label: string;
  if (diffMin < 1)         label = 'hace un momento';
  else if (diffMin < 60)   label = `hace ${diffMin} min`;
  else if (diffMin < 1440) label = `hace ${Math.floor(diffMin / 60)}h`;
  else label = d.toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  return <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>· Última edición: {label}</span>;
}

export default async function SettingsPage() {
  let settings: Settings = {
    waNumber:     '56985219094',
    address:      'Marino José Manuel Ramírez #1641',
    schedule:     'Lunes a Domingo 12:00 – 22:00',
    isOpen:       true,
    waGreeting:   "Hola Gustoso's! Quiero hacer un pedido 🛒",
    waFooter:     '',
    delivery:     { ...DEFAULT_DELIVERY },
    mostradorPin: '',
    autoSchedule: { ...DEFAULT_AUTO_SCHEDULE },
  };
  let updatedAt: string | null = null;

  try {
    [settings, updatedAt] = await Promise.all([getSettings(), getSettingsUpdatedAt()]);
  } catch {
    /* usa defaults si Firestore no responde */
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginBottom:4, display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
          Configuración
          <LastEdited iso={updatedAt}/>
        </h1>
        <p style={{ fontSize:14, color:'var(--text-muted)' }}>
          Número de WhatsApp, dirección y horario del local.
        </p>
      </div>
      <div style={{ maxWidth: 560 }}>
        <SettingsEditor initial={settings} />
      </div>
    </div>
  );
}
