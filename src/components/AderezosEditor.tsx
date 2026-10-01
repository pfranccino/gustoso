'use client';

import { useState, useTransition } from 'react';
import { Droplets, Pencil, Plus } from 'lucide-react';
import { Aderezo } from '@/lib/firestore/aderezosTypes';

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

const INPUT: React.CSSProperties = {
  padding: '8px 11px', borderRadius: 8,
  border: '1.5px solid var(--line)',
  background: 'var(--surface-subtle)', color: 'var(--ink-900)',
  fontSize: 13, fontFamily: "'Barlow',sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

type FormState = { name: string; price: string };
const EMPTY: FormState = { name: '', price: '0' };

export default function AderezosEditor({ initial }: { initial: Aderezo[] }) {
  const [items,      setItems]      = useState<Aderezo[]>(initial);
  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [error,      setError]      = useState('');
  const [isPending,  startTransition] = useTransition();

  function openEdit(a: Aderezo) {
    setEditId(a.id);
    setForm({ name: a.name, price: String(a.price) });
    setError('');
  }

  function cancelEdit() {
    setEditId(null);
    setForm(EMPTY);
    setError('');
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) { setError('El nombre es requerido'); return; }
    const price = parseInt(form.price) || 0;
    setError('');

    startTransition(async () => {
      try {
        if (editId) {
          await fetch(`/api/admin/aderezos/${editId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price }),
          });
          setItems(prev => prev.map(a => a.id === editId ? { ...a, name, price } : a));
          cancelEdit();
        } else {
          const res = await fetch('/api/admin/aderezos', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price }),
          });
          const { id } = await res.json();
          setItems(prev => [...prev, { id, name, price, available: true }]);
          setForm(EMPTY);
        }
      } catch { setError('Error al guardar. Intenta de nuevo.'); }
    });
  }

  function handleToggle(a: Aderezo) {
    startTransition(async () => {
      await fetch(`/api/admin/aderezos/${a.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !a.available }),
      });
      setItems(prev => prev.map(x => x.id === a.id ? { ...x, available: !x.available } : x));
    });
  }

  function handleDelete(a: Aderezo) {
    if (!confirm(`¿Eliminar "${a.name}"?`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/aderezos/${a.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(x => x.id !== a.id));
    });
  }

  return (
    <div style={{ maxWidth: 520 }}>

      {/* Formulario nuevo / editar */}
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--ink-900)', marginBottom: 16 }}>
          {editId ? <><Pencil size={14} style={{display:'inline', verticalAlign:'middle'}}/> Editar aderezo</> : <><Plus size={14} style={{display:'inline', verticalAlign:'middle'}}/> Nuevo aderezo</>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Ej: Pebre, Chimichurri, Mayonesa"
              style={{ ...INPUT, width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Precio ($)</label>
            <input
              type="number" min="0"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0 = gratis"
              style={{ ...INPUT, width: '100%' }}
            />
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={isPending || !form.name.trim()}
            style={{ flex: 1, padding: '10px', borderRadius: 999, border: 'none', background: (!form.name.trim() || isPending) ? '#d1bfb8' : 'var(--brand-strong)', color: 'var(--on-brand)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, cursor: (!form.name.trim() || isPending) ? 'not-allowed' : 'pointer' }}>
            {isPending ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editId && (
            <button onClick={cancelEdit}
              style={{ padding: '10px 20px', borderRadius: 999, border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--ink-900)', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ marginBottom: 10 }}><Droplets size={32} style={{color:'var(--ink-500)'}}/></div>
          <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>No hay aderezos aún. Agrega el primero.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(a => (
            <div key={a.id} style={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: a.available ? 1 : 0.55 }}>
              {/* Toggle disponibilidad */}
              <button onClick={() => handleToggle(a)}
                style={{ flexShrink: 0, width: 32, height: 18, borderRadius: 999, border: 'none', background: a.available ? 'var(--brand)' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                <span style={{ position: 'absolute', top: 2, left: a.available ? 15 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }}/>
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--ink-900)' }}>{a.name}</span>
                <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 700, color: a.price > 0 ? 'var(--brand)' : '#16a34a' }}>
                  {a.price > 0 ? `+${fmt(a.price)}` : 'Gratis'}
                </span>
                {!a.available && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink-500)', fontWeight: 600 }}>Deshabilitado</span>}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(a)}
                  style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-900)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(a)}
                  style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
