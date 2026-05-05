'use client';

import { useState, useTransition } from 'react';
import { MenuItem } from '@/lib/firestore/menuItems';

const CATEGORY_LABELS: Record<string, string> = {
  vienesas:  '🌭 Vienesas',
  as:        '🥪 AS',
  churrasco: '🥩 Churrasco',
  mechada:   '🥖 Mechada',
  papas:     '🍟 Papas & Más',
};

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

type EditState = {
  item: MenuItem;
  name: string;
  desc: string;
  price: string;
  priceNormal: string;
  priceXL: string;
};

export default function MenuEditor({ initialItems }: { initialItems: MenuItem[] }) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  /* ── helpers ─────────────────────────────────────── */

  async function patch(id: string, update: Partial<MenuItem>) {
    const res = await fetch(`/api/menu/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  function applyLocal(id: string, update: Partial<MenuItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...update } : it));
  }

  /* ── visible toggle ──────────────────────────────── */

  function toggleVisible(item: MenuItem) {
    const next = !item.visible;
    applyLocal(item.id, { visible: next });
    patch(item.id, { visible: next }).catch(() => applyLocal(item.id, { visible: item.visible }));
  }

  /* ── edit modal ──────────────────────────────────── */

  function openEdit(item: MenuItem) {
    setEditing({
      item,
      name:        item.name,
      desc:        item.desc ?? '',
      price:       item.price != null ? String(item.price) : '',
      priceNormal: item.priceNormal != null ? String(item.priceNormal) : '',
      priceXL:     item.priceXL != null ? String(item.priceXL) : '',
    });
    setSaveError('');
  }

  function closeEdit() { setEditing(null); setSaveError(''); }

  function handleSave() {
    if (!editing) return;
    const { item } = editing;
    const isDual = item.priceNormal != null;

    const update: Partial<MenuItem> = {
      name: editing.name.trim() || item.name,
      desc: editing.desc.trim() || null,
    };

    if (isDual) {
      update.priceNormal = parseInt(editing.priceNormal, 10) || item.priceNormal!;
      update.priceXL     = parseInt(editing.priceXL,     10) || item.priceXL!;
    } else {
      update.price = parseInt(editing.price, 10) || item.price!;
    }

    startTransition(async () => {
      try {
        await patch(item.id, update);
        applyLocal(item.id, update);
        closeEdit();
      } catch {
        setSaveError('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  /* ── delete ─────────────────────────────────────── */

  async function handleDelete(item: MenuItem) {
    if (!confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;
    applyLocal(item.id, { visible: false }); // feedback optimista
    try {
      await fetch(`/api/menu/${item.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(it => it.id !== item.id));
    } catch {
      applyLocal(item.id, { visible: item.visible }); // revertir
    }
  }

  /* ── seed ────────────────────────────────────────── */

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.seeded) {
        setSeedMsg(`✓ Menú importado (${data.count} items). Recarga la página.`);
      } else {
        setSeedMsg('El menú ya tiene datos, no se sobreescribió.');
      }
    } catch {
      setSeedMsg('Error al importar.');
    }
    setSeeding(false);
  }

  /* ── group by category ───────────────────────────── */

  const byCategory = items.reduce<Record<string, MenuItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  const isDual = (it: MenuItem) => it.priceNormal != null;

  /* ── render ──────────────────────────────────────── */

  return (
    <>
      {/* Seed banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            padding: '9px 18px',
            borderRadius: 999,
            border: '1.5px solid #F26419',
            background: 'transparent',
            color: '#F26419',
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: seeding ? 'not-allowed' : 'pointer',
            opacity: seeding ? 0.6 : 1,
          }}
        >
          {seeding ? 'Importando…' : 'Importar menú inicial'}
        </button>
        {seedMsg && <span style={{ fontSize: 13, color: '#A0541A', fontWeight: 600 }}>{seedMsg}</span>}
      </div>

      {/* Category sections */}
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
        const catItems = byCategory[cat];
        if (!catItems?.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 900, fontSize: 20,
              color: 'var(--text)', marginBottom: 12,
              borderBottom: '1.5px solid var(--border)', paddingBottom: 8,
            }}>
              {label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catItems.map(item => (
                <div key={item.id} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: item.visible ? 1 : 0.5,
                }}>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleVisible(item)}
                    title={item.visible ? 'Ocultar' : 'Mostrar'}
                    style={{
                      flexShrink: 0,
                      width: 36, height: 20,
                      borderRadius: 999,
                      border: 'none',
                      background: item.visible ? '#F26419' : '#d1d5db',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background .2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 2, left: item.visible ? 18 : 2,
                      width: 16, height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left .2s',
                    }}/>
                  </button>

                  {/* Name + desc */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    {item.desc && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.desc}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {isDual(item)
                      ? `${fmt(item.priceNormal!)} / ${fmt(item.priceXL!)}`
                      : fmt(item.price!)}
                  </div>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(item)}
                    style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Editar
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item)}
                    style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(220,38,38,0.3)', background: 'transparent', fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}
                    title="Eliminar ítem"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Edit modal */}
      {editing && (
        <div
          onClick={closeEdit}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
          >
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#1A0800', marginBottom: 20 }}>
              Editar ítem
            </h2>

            <Field label="Nombre" value={editing.name} onChange={e => setEditing(p => p && ({ ...p, name: e.target.value }))} />
            <Field label="Descripción" value={editing.desc} placeholder="(opcional)" onChange={e => setEditing(p => p && ({ ...p, desc: e.target.value }))} />

            {isDual(editing.item) ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Precio Normal" type="number" value={editing.priceNormal} onChange={e => setEditing(p => p && ({ ...p, priceNormal: e.target.value }))} />
                <Field label="Precio XL"     type="number" value={editing.priceXL}     onChange={e => setEditing(p => p && ({ ...p, priceXL:     e.target.value }))} />
              </div>
            ) : (
              <Field label="Precio" type="number" value={editing.price} onChange={e => setEditing(p => p && ({ ...p, price: e.target.value }))} />
            )}

            {saveError && (
              <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>{saveError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={handleSave}
                disabled={isPending}
                style={{
                  flex: 1, padding: '12px', borderRadius: 999, border: 'none',
                  background: isPending ? '#d1bfb8' : '#F26419',
                  color: '#fff',
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 900, fontSize: 18,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                onClick={closeEdit}
                style={{
                  padding: '12px 20px', borderRadius: 999,
                  border: '1.5px solid var(--border)',
                  background: 'transparent',
                  fontFamily: "'Barlow Condensed',sans-serif",
                  fontWeight: 700, fontSize: 16,
                  cursor: 'pointer', color: 'var(--text-muted)',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, ...inputProps }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#A0541A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </label>
      <input
        {...inputProps}
        style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid rgba(242,100,25,0.25)', background: '#FFF9F5', color: '#1A0800', fontSize: 14, fontFamily: "'Barlow',sans-serif", boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  );
}
