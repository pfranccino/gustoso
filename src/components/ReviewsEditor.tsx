'use client';

import { useState, useTransition } from 'react';
import { Review } from '@/lib/firestore/reviews';

const STAR_BTN: React.CSSProperties = { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, padding: '0 2px', lineHeight: 1 };
const INPUT: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 8, border: '1.5px solid rgba(242,100,25,0.25)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13, fontFamily: "'Barlow',sans-serif", outline: 'none', boxSizing: 'border-box' as const };

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={STAR_BTN}>
          <span style={{ color: n <= value ? '#f59e0b' : '#d1d5db' }}>★</span>
        </button>
      ))}
    </div>
  );
}

type FormState = { name: string; stars: number; text: string };
const EMPTY: FormState = { name: '', stars: 5, text: '' };

export default function ReviewsEditor({ initial }: { initial: Review[] }) {
  const [reviews,   setReviews]   = useState<Review[]>(initial);
  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [editing,   setEditing]   = useState<Review | null>(null);
  const [editForm,  setEditForm]  = useState<FormState>(EMPTY);
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  /* ── create ── */
  function handleAdd() {
    if (!form.name.trim() || !form.text.trim()) { setError('Nombre y comentario son requeridos.'); return; }
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, sortOrder: reviews.length, visible: true }),
        });
        if (!res.ok) throw new Error();
        const { id } = await res.json();
        setReviews(prev => [...prev, { id, ...form, sortOrder: prev.length, visible: true }]);
        setForm(EMPTY);
      } catch { setError('Error al guardar.'); }
    });
  }

  /* ── toggle visible ── */
  function handleToggle(r: Review) {
    const visible = !r.visible;
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, visible } : x));
    fetch(`/api/admin/reviews/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible }),
    });
  }

  /* ── delete ── */
  function handleDelete(r: Review) {
    if (!confirm(`¿Eliminar reseña de "${r.name}"?`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/reviews/${r.id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(x => x.id !== r.id));
    });
  }

  /* ── edit ── */
  function openEdit(r: Review) {
    setEditing(r);
    setEditForm({ name: r.name, stars: r.stars, text: r.text });
  }

  function handleSave() {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.text.trim()) return;
    startTransition(async () => {
      try {
        await fetch(`/api/admin/reviews/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        setReviews(prev => prev.map(x => x.id === editing.id ? { ...x, ...editForm } : x));
        setEditing(null);
      } catch { setError('Error al guardar.'); }
    });
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {error && <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>{error}</div>}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {reviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⭐</div>
            <div style={{ fontSize: 14 }}>No hay reseñas aún. Agrega la primera.</div>
          </div>
        )}

        {reviews.map(r => (
          <div key={r.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', opacity: r.visible ? 1 : 0.5 }}>
            {/* Toggle */}
            <button onClick={() => handleToggle(r)} title={r.visible ? 'Ocultar' : 'Mostrar'}
              style={{ flexShrink: 0, marginTop: 2, width: 32, height: 18, borderRadius: 999, border: 'none', background: r.visible ? '#F26419' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
              <span style={{ position: 'absolute', top: 2, left: r.visible ? 15 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#f59e0b' }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{r.name}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{r.text}"</p>
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => openEdit(r)}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Editar
              </button>
              <button onClick={() => handleDelete(r)} disabled={isPending}
                style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Agregar nueva */}
      <div style={{ background: 'var(--card)', border: '2px dashed rgba(242,100,25,0.3)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: .5, textTransform: 'uppercase' }}>Nueva reseña</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>NOMBRE</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Francisca M." style={INPUT} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>ESTRELLAS</label>
            <StarPicker value={form.stars} onChange={stars => setForm(f => ({ ...f, stars }))} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>COMENTARIO</label>
          <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Copia el comentario de Google Maps aquí…" rows={3}
            style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} />
        </div>

        <button onClick={handleAdd} disabled={isPending}
          style={{ padding: '11px', borderRadius: 999, border: 'none', background: '#F26419', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}>
          + Agregar reseña
        </button>
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div style={{ background: 'var(--card)', borderRadius: '16px 16px 0 0', padding: '24px 20px 32px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--text)', marginBottom: 20 }}>Editar reseña</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>NOMBRE</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={INPUT} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>ESTRELLAS</label>
                  <StarPicker value={editForm.stars} onChange={stars => setEditForm(f => ({ ...f, stars }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>COMENTARIO</label>
                <textarea value={editForm.text} onChange={e => setEditForm(f => ({ ...f, text: e.target.value }))}
                  rows={4} style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditing(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 999, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending}
                style={{ flex: 2, padding: '11px', borderRadius: 999, border: 'none', background: '#F26419', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, cursor: 'pointer' }}>
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
