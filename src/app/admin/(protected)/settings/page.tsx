import { getSettings } from '@/lib/firestore/settings';
import SettingsEditor from '@/components/SettingsEditor';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let settings = {
    waNumber: '56985219094',
    address:  'Marino José Manuel Ramírez #1641',
    schedule: 'Lunes a Domingo 12:00 – 22:00',
    isOpen:   true,
  };

  try {
    settings = await getSettings();
  } catch {
    /* usa defaults si Firestore no responde */
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Configuración
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Número de WhatsApp, dirección y horario del local.
        </p>
      </div>
      <SettingsEditor initial={settings} />
    </div>
  );
}
