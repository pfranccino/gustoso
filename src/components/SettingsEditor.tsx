'use client';

import { useState, useTransition } from 'react';
import { Settings } from '@/lib/firestore/settings';

const INPUT: React.CSSProperties = {
  display: 'block', width: '100%', padding: '11px 13px',
  borderRadius: 8, border: '1.5px solid rgba(242,100,25,0.25)',
  background: '#FFF9F5', color: '#1A0800', fontSize: 14,
  fontFamily: "'Barlow',sans-serif", boxSizing: 'border-box', outline: 'none',
};

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#A0541A', letterSpacing: 1,
  textTransform: 'uppercase', marginBottom: 6,
};

export default function SettingsEditor({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function set(key: keyof Settings, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError('');
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error();
        setSaved(true);
      } catch {
        setError('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  return (
    <div style={{ maxWidth: 520 }}>
      {/* WhatsApp */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
          📱 WhatsApp
        </div>
        <label style={LABEL}>Número (con código de país, sin +)</label>
        <input
          style={INPUT}
          value={form.waNumber}
          onChange={e => set('waNumber', e.target.value)}
          placeholder="56912345678"
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Los pedidos se envían a este número. Ej: 56985219094
        </div>
      </div>

      {/* Dirección */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
          📍 Dirección
        </div>
        <label style={LABEL}>Dirección del local</label>
        <input
          style={INPUT}
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="Calle Nombre #123"
        />
      </div>

      {/* Horario */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
          🕐 Horario
        </div>
        <label style={LABEL}>Texto del horario</label>
        <input
          style={INPUT}
          value={form.schedule}
          onChange={e => set('schedule', e.target.value)}
          placeholder="Lunes a Domingo 12:00 – 22:00"
        />

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => set('isOpen', !form.isOpen)}
            style={{
              width: 44, height: 24, borderRadius: 999, border: 'none',
              background: form.isOpen ? '#F26419' : '#d1d5db',
              cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: form.isOpen ? 22 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left .2s',
            }}/>
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: form.isOpen ? 'var(--orange)' : 'var(--text-muted)' }}>
            {form.isOpen ? 'Local abierto' : 'Local cerrado'}
          </span>
        </div>
      </div>

      {/* Save */}
      {error && (
        <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>{error}</div>
      )}
      {saved && (
        <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>
          ✓ Guardado correctamente
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={isPending}
        style={{
          width: '100%', padding: '13px', borderRadius: 999, border: 'none',
          background: isPending ? '#d1bfb8' : '#F26419',
          color: '#fff', fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 900, fontSize: 20,
          cursor: isPending ? 'not-allowed' : 'pointer',
          boxShadow: isPending ? 'none' : '0 4px 16px rgba(242,100,25,0.30)',
        }}
      >
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}
