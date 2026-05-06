'use client';

import { useState, useTransition } from 'react';
import { Settings, DeliveryZone } from '@/lib/firestore/settings';

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

      {/* Mensaje WhatsApp */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>
          💬 Mensaje de pedido
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Personaliza el texto que el cliente envía por WhatsApp.
        </div>

        <label style={LABEL}>Saludo (primera línea)</label>
        <input
          style={{ ...INPUT, marginBottom: 14 }}
          value={form.waGreeting}
          onChange={e => set('waGreeting', e.target.value)}
          placeholder="Hola Gustoso's! Quiero hacer un pedido 🛒"
        />

        <label style={LABEL}>Cierre (opcional, al final del mensaje)</label>
        <input
          style={{ ...INPUT, marginBottom: 16 }}
          value={form.waFooter}
          onChange={e => set('waFooter', e.target.value)}
          placeholder="Ej: ¡Gracias! Te esperamos 🙌"
        />

        {/* Preview */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#A0541A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Vista previa
        </div>
        <div style={{ background: '#e9fbe9', border: '1px solid #c3e6c3', borderRadius: 10, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#1a3a1a', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`🧾 Pedido GST-ABCD
${form.waGreeting}

1. 1x Vienesa Alemana — $2.800
   ❌ Sin: Chucrut
2. 2x AS Italiano — $9.000

💰 TOTAL: $11.800${form.waFooter ? `\n\n${form.waFooter}` : ''}`}
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

      {/* Delivery */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>
          🛵 Delivery
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          Calcula el costo según distancia desde el local al cliente (línea recta).
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setForm(f => ({ ...f, delivery: { ...f.delivery, enabled: !f.delivery.enabled } }))}
            style={{ width: 44, height: 24, borderRadius: 999, border: 'none', background: form.delivery.enabled ? '#F26419' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: form.delivery.enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }}/>
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: form.delivery.enabled ? 'var(--orange)' : 'var(--text-muted)' }}>
            {form.delivery.enabled ? 'Delivery habilitado' : 'Delivery deshabilitado'}
          </span>
        </div>

        {form.delivery.enabled && (
          <>
            {/* Coordenadas */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...LABEL, marginBottom: 4 }}>Coordenadas del local</label>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Abre <a href={`https://maps.google.com/?q=${encodeURIComponent(form.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)' }}>Google Maps</a>, haz clic derecho sobre el local → &quot;¿Qué hay aquí?&quot; y copia las coordenadas.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...LABEL, fontSize: 10 }}>Latitud</label>
                  <input type="number" step="any"
                    value={form.delivery.restaurantLat || ''}
                    onChange={e => setForm(f => ({ ...f, delivery: { ...f.delivery, restaurantLat: parseFloat(e.target.value) || 0 } }))}
                    placeholder="-33.4513"
                    style={INPUT} />
                </div>
                <div>
                  <label style={{ ...LABEL, fontSize: 10 }}>Longitud</label>
                  <input type="number" step="any"
                    value={form.delivery.restaurantLng || ''}
                    onChange={e => setForm(f => ({ ...f, delivery: { ...f.delivery, restaurantLng: parseFloat(e.target.value) || 0 } }))}
                    placeholder="-70.6653"
                    style={INPUT} />
                </div>
              </div>
            </div>

            {/* Zonas */}
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL}>Zonas de precio</label>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Hasta X km → precio fijo. Ordenadas de menor a mayor distancia.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.delivery.zones.map((zone, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...LABEL, fontSize: 10 }}>Hasta (km)</label>
                      <input type="number" min="0" step="0.5"
                        value={zone.maxKm}
                        onChange={e => {
                          const zones = form.delivery.zones.map((z, j) => j === i ? { ...z, maxKm: parseFloat(e.target.value) || 0 } : z);
                          setForm(f => ({ ...f, delivery: { ...f.delivery, zones } }));
                        }}
                        style={INPUT} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ ...LABEL, fontSize: 10 }}>Precio ($)</label>
                      <input type="number" min="0"
                        value={zone.price}
                        onChange={e => {
                          const zones = form.delivery.zones.map((z, j) => j === i ? { ...z, price: parseInt(e.target.value) || 0 } : z);
                          setForm(f => ({ ...f, delivery: { ...f.delivery, zones } }));
                        }}
                        style={INPUT} />
                    </div>
                    <button
                      onClick={() => setForm(f => ({ ...f, delivery: { ...f.delivery, zones: f.delivery.zones.filter((_, j) => j !== i) } }))}
                      style={{ marginTop: 18, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'transparent', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const last = form.delivery.zones[form.delivery.zones.length - 1];
                  const newZone: DeliveryZone = { maxKm: last ? last.maxKm + 3 : 2, price: last ? last.price + 500 : 1500 };
                  setForm(f => ({ ...f, delivery: { ...f.delivery, zones: [...f.delivery.zones, newZone] } }));
                }}
                style={{ marginTop: 10, padding: '7px 16px', borderRadius: 999, border: '1.5px dashed rgba(242,100,25,0.4)', background: 'transparent', color: '#F26419', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Agregar zona
              </button>
            </div>

            {/* Precio por km extra */}
            <div>
              <label style={LABEL}>Precio por km adicional (más allá de la última zona)</label>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Pon 0 si no quieres hacer delivery fuera de las zonas definidas.
              </div>
              <input type="number" min="0"
                value={form.delivery.extraPricePerKm}
                onChange={e => setForm(f => ({ ...f, delivery: { ...f.delivery, extraPricePerKm: parseInt(e.target.value) || 0 } }))}
                placeholder="500"
                style={INPUT} />
            </div>
          </>
        )}
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
