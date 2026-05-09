'use client';

import { useState } from 'react';

type SeedStatus = 'idle' | 'loading' | 'success' | 'skipped' | 'error';

type SeedConfig = {
  key:         string;
  emoji:       string;
  title:       string;
  description: string;
  detail:      string;
  endpoint:    string;
};

const SEEDS: SeedConfig[] = [
  {
    key:         'menu',
    emoji:       '🍔',
    title:       'Menú + Burrito',
    description: 'Productos iniciales del menú (vienesas, sándwiches AS) y configuración del burrito builder.',
    detail:      'Solo se ejecuta si menu_items está vacío.',
    endpoint:    '/api/admin/seed',
  },
  {
    key:         'promotions',
    emoji:       '🎁',
    title:       'Promociones',
    description: '6 combos de ejemplo (Completo + Bebida, AS + Papas, etc.).',
    detail:      'Solo se ejecuta si promotions está vacío.',
    endpoint:    '/api/admin/seed-promotions',
  },
  {
    key:         'aderezos',
    emoji:       '🫙',
    title:       'Aderezos',
    description: '8 aderezos estándar: Ketchup, Mostaza, Mayonesa, BBQ, Tártara, Relish, Alioli, Dijon.',
    detail:      'Solo se ejecuta si aderezos está vacío.',
    endpoint:    '/api/admin/seed-aderezos',
  },
];

type SeedState = { status: SeedStatus; message: string };

export default function SeedPage() {
  const [states, setStates] = useState<Record<string, SeedState>>(
    Object.fromEntries(SEEDS.map(s => [s.key, { status: 'idle', message: '' }]))
  );
  const [runningAll, setRunningAll] = useState(false);

  function setStatus(key: string, status: SeedStatus, message = '') {
    setStates(prev => ({ ...prev, [key]: { status, message } }));
  }

  async function runSeed(seed: SeedConfig) {
    setStatus(seed.key, 'loading');
    try {
      const res  = await fetch(seed.endpoint, { method: 'POST' });
      const data = await res.json();
      if (!res.ok)       setStatus(seed.key, 'error',   data.error ?? 'Error desconocido');
      else if (data.skipped) setStatus(seed.key, 'skipped', data.reason ?? 'Ya existe data');
      else               setStatus(seed.key, 'success', `${data.seeded ?? data.count ?? '✓'} registros creados`);
    } catch {
      setStatus(seed.key, 'error', 'Error de conexión');
    }
  }

  async function runAll() {
    setRunningAll(true);
    for (const seed of SEEDS) {
      await runSeed(seed);
    }
    setRunningAll(false);
  }

  const STATUS_STYLE: Record<SeedStatus, { color: string; bg: string; label: string }> = {
    idle:    { color: 'var(--text-muted)', bg: 'transparent',              label: '' },
    loading: { color: '#d97706',           bg: 'rgba(217,119,6,0.08)',     label: 'Ejecutando…' },
    success: { color: '#16a34a',           bg: 'rgba(22,163,74,0.08)',     label: '✓ Completado' },
    skipped: { color: '#0891b2',           bg: 'rgba(8,145,178,0.08)',     label: '⟳ Omitido' },
    error:   { color: '#dc2626',           bg: 'rgba(220,38,38,0.08)',     label: '✕ Error' },
  };

  const anyLoading = Object.values(states).some(s => s.status === 'loading') || runningAll;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', margin: 0 }}>
          Seed de datos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          Carga datos iniciales en la base de datos. Cada seed verifica si ya existe data antes de insertar — es seguro ejecutarlos más de una vez.
        </p>
      </div>

      {/* Aviso */}
      <div style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
        ⚠️ <strong>Úsalo solo si la BD está vacía o perdiste datos.</strong> Los seeds no sobrescriben data existente — si ya hay registros en una colección, ese seed se omite automáticamente.
      </div>

      {/* Cards de seeds */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {SEEDS.map(seed => {
          const st = states[seed.key];
          const sty = STATUS_STYLE[st.status];
          const isLoading = st.status === 'loading';

          return (
            <div key={seed.key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{seed.emoji}</div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 2 }}>
                  {seed.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{seed.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{seed.detail}</div>
              </div>

              {/* Estado */}
              {st.status !== 'idle' && (
                <div style={{ background: sty.bg, borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 140 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: sty.color }}>{sty.label}</div>
                  {st.message && <div style={{ fontSize: 11, color: sty.color, marginTop: 2 }}>{st.message}</div>}
                </div>
              )}

              <button
                onClick={() => runSeed(seed)}
                disabled={anyLoading}
                style={{ padding: '9px 22px', borderRadius: 999, border: 'none', background: anyLoading ? '#d1bfb8' : '#F26419', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, cursor: anyLoading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Ejecutando…' : 'Ejecutar'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Ejecutar todos */}
      <button
        onClick={runAll}
        disabled={anyLoading}
        style={{ width: '100%', padding: '13px', borderRadius: 999, border: `2px solid ${anyLoading ? '#d1bfb8' : '#F26419'}`, background: 'transparent', color: anyLoading ? '#d1bfb8' : '#F26419', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, cursor: anyLoading ? 'not-allowed' : 'pointer' }}>
        {runningAll ? 'Ejecutando todos…' : '🌱 Ejecutar todos los seeds'}
      </button>
    </div>
  );
}
