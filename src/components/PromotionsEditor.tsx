'use client';

import { useState, useTransition } from 'react';
import { Promotion, PromoChoice } from '@/lib/firestore/promotions';
import { MenuItem } from '@/lib/firestore/menuItems';

const BADGES = ['', 'PROMO', 'OFERTA', 'NUEVO', 'COMBO', 'ESPECIAL'];

const CATEGORY_LABEL: Record<string, string> = {
  vienesas:  '🌭 Vienesas',
  as:        '🥪 AS',
  churrasco: '🥩 Churrasco',
  mechada:   '🥖 Mechada',
  papas:     '🍟 Papas & Más',
  bebidas:   '🥤 Bebidas',
};

const CHOICE_CATEGORIES = Object.entries(CATEGORY_LABEL).map(([id, label]) => ({ id, label }));

type FormState = {
  name: string;
  description: string;
  price: string;
  badge: string;
  choices: PromoChoice[];
  visible: boolean;
};

const EMPTY_FORM: FormState = {
  name: '', description: '', price: '', badge: 'PROMO',
  choices: [], visible: true,
};

function toForm(p: Promotion): FormState {
  return {
    name:        p.name,
    description: p.description,
    price:       p.price > 0 ? String(p.price) : '',
    badge:       p.badge,
    choices:     p.choices ?? [],
    visible:     p.visible,
  };
}

/* ── ChoicesEditor ──────────────────────────────────────── */

/** Resuelve preview de opciones igual que en PromoCard */
function resolvePreview(choice: PromoChoice, menuItems: MenuItem[]): string[] {
  if (choice.category) {
    const all = menuItems
      .filter(m => m.category === choice.category && m.visible)
      .map(m => m.volume ? `${m.name} ${m.volume}` : m.name);
    if (choice.options.length > 0) {
      const wl = new Set(choice.options);
      return all.filter(n => wl.has(n));
    }
    return all;
  }
  return choice.options;
}

function ChoicesEditor({ choices, onChange, menuItems }: { choices: PromoChoice[]; onChange: (v: PromoChoice[]) => void; menuItems: MenuItem[] }) {
  const [newLabel,    setNewLabel]    = useState('');
  const [newCategory, setNewCategory] = useState('');   // '' = manual
  const [newOptions,  setNewOptions]  = useState('');   // modo manual: texto libre
  const [newFilter,   setNewFilter]   = useState<string[]>([]); // modo categoría: whitelist
  const [newRequired, setNewRequired] = useState(true);

  // Todos los items de la categoría seleccionada
  const categoryItems = newCategory
    ? menuItems.filter(m => m.category === newCategory && m.visible).map(m => m.volume ? `${m.name} ${m.volume}` : m.name)
    : [];

  function toggleFilter(name: string) {
    setNewFilter(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  function addChoice() {
    const label = newLabel.trim() || (newCategory ? (CATEGORY_LABEL[newCategory] ?? newCategory) : '');
    if (!label) return;
    if (newCategory) {
      onChange([...choices, { label, category: newCategory, options: newFilter, required: newRequired }]);
    } else {
      const options = newOptions.split(',').map(s => s.trim()).filter(Boolean);
      if (options.length === 0) return;
      onChange([...choices, { label, category: null, options, required: newRequired }]);
    }
    setNewLabel(''); setNewCategory(''); setNewOptions(''); setNewFilter([]); setNewRequired(true);
  }

  function remove(idx: number) {
    onChange(choices.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:8 }}>
        🔀 Opciones del cliente <span style={{ fontWeight:400, textTransform:'none', fontSize:11 }}>(ej: tipo de sándwich, bebida)</span>
      </label>

      {/* Choices existentes */}
      {choices.map((c, i) => {
        const preview = resolvePreview(c, menuItems);
        const isFiltered = c.category && c.options.length > 0;
        return (
          <div key={i} style={{ background:'rgba(242,100,25,0.05)', border:'1.5px solid rgba(242,100,25,0.2)', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{c.label}</span>
                {c.category && (
                  <span style={{ fontSize:10, color:'#0891b2', fontWeight:700, background:'rgba(8,145,178,0.1)', padding:'1px 6px', borderRadius:4 }}>
                    📋 {CATEGORY_LABEL[c.category] ?? c.category}
                    {isFiltered && <span style={{ marginLeft:4, color:'#d97706' }}>• {c.options.length} filtradas</span>}
                  </span>
                )}
                {c.required && <span style={{ fontSize:10, color:'#dc2626', fontWeight:700 }}>REQUERIDO</span>}
              </div>
              <button onClick={() => remove(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#dc2626', fontSize:16, fontWeight:700, lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {preview.map(opt => (
                <span key={opt} style={{ fontSize:11, background:'rgba(242,100,25,0.1)', color:'#A0541A', padding:'2px 8px', borderRadius:4, fontWeight:600 }}>{opt}</span>
              ))}
              {preview.length === 0 && <span style={{ fontSize:11, color:'#999', fontStyle:'italic' }}>Sin items visibles en esta categoría</span>}
            </div>
          </div>
        );
      })}

      {/* Agregar nueva opción */}
      <div style={{ border:'1.5px dashed rgba(242,100,25,0.3)', borderRadius:8, padding:'12px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5 }}>NUEVA OPCIÓN</div>

        {/* Fuente */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6 }}>Fuente de opciones</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            <button onClick={() => { setNewCategory(''); setNewFilter([]); }}
              style={{ padding:'5px 12px', borderRadius:999, border:`2px solid ${!newCategory ? '#F26419' : 'rgba(242,100,25,0.25)'}`, background: !newCategory ? '#F26419' : 'transparent', color: !newCategory ? '#fff' : '#A0541A', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ✏️ Manual
            </button>
            {CHOICE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { setNewCategory(cat.id); setNewFilter([]); setNewLabel(l => l || cat.label.replace(/^[^ ]+ /, '')); }}
                style={{ padding:'5px 12px', borderRadius:999, border:`2px solid ${newCategory === cat.id ? '#0891b2' : 'rgba(8,145,178,0.2)'}`, background: newCategory === cat.id ? '#0891b2' : 'transparent', color: newCategory === cat.id ? '#fff' : '#0891b2', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Checkboxes de items de la categoría */}
        {newCategory && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6 }}>
              Incluir en la opción{' '}
              <span style={{ fontWeight:400, color:'#999' }}>
                {newFilter.length === 0 ? '(todos — deja sin marcar para mostrar todos)' : `${newFilter.length} seleccionados`}
              </span>
            </div>
            {categoryItems.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:180, overflowY:'auto', border:'1px solid rgba(8,145,178,0.15)', borderRadius:8, padding:'8px 10px', background:'rgba(8,145,178,0.03)' }}>
                {categoryItems.map(name => {
                  const checked = newFilter.includes(name);
                  return (
                    <label key={name} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'3px 0' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleFilter(name)}
                        style={{ accentColor:'#0891b2', width:14, height:14, flexShrink:0 }} />
                      <span style={{ fontSize:13, fontWeight: checked ? 700 : 500, color: checked ? '#0891b2' : 'var(--text)' }}>{name}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize:11, color:'#999', fontStyle:'italic' }}>No hay items visibles en esta categoría aún</div>
            )}
          </div>
        )}

        {/* Etiqueta */}
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
          placeholder={newCategory ? `Etiqueta (ej: ${CATEGORY_LABEL[newCategory]?.replace(/^[^ ]+ /, '') ?? 'Elige'})` : 'Etiqueta — ej: "Tipo de Churrasco"'}
          style={{ ...INPUT }} />

        {/* Opciones manuales */}
        {!newCategory && (
          <input value={newOptions} onChange={e => setNewOptions(e.target.value)}
            placeholder="Opciones separadas por coma — ej: Alemano, Italiano, Completo"
            style={{ ...INPUT }} />
        )}

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text)' }}>
            <input type="checkbox" checked={newRequired} onChange={e => setNewRequired(e.target.checked)}
              style={{ accentColor:'#F26419', width:14, height:14 }} />
            Requerido
          </label>
          <button onClick={addChoice}
            style={{ padding:'6px 16px', borderRadius:999, border:'none', background:'#F26419', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>
            + Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT: React.CSSProperties = {
  padding: '8px 11px', borderRadius: 8,
  border: '1.5px solid rgba(242,100,25,0.25)',
  background: '#FFF9F5', color: '#1A0800',
  fontSize: 13, fontFamily: "'Barlow',sans-serif",
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

/* ── PromoModal ─────────────────────────────────────────── */

function PromoModal({
  title, form, setForm, menuItems, onSave, onCancel, saving,
}: {
  title: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  menuItems: MenuItem[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background:'var(--card)', borderRadius:'16px 16px 0 0', padding:'24px 20px 32px', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)', marginBottom:20 }}>{title}</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>Nombre</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Combo Completo + Bebida" style={INPUT} />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>Descripción corta</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Completo italiano + bebida a elección" style={INPUT} />
          </div>

          {/* Price */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>Precio ($)</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0" style={INPUT} />
          </div>

          {/* Badge */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>Etiqueta</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {BADGES.map(b => (
                <button key={b} onClick={() => setForm(f => ({ ...f, badge: b }))}
                  style={{ padding:'5px 12px', borderRadius:999, border:'2px solid', fontSize:12, fontWeight:700, cursor:'pointer',
                    borderColor: form.badge === b ? '#F26419' : 'rgba(242,100,25,0.2)',
                    background:  form.badge === b ? '#F26419' : 'transparent',
                    color:       form.badge === b ? '#fff' : '#A0541A' }}>
                  {b || 'Sin etiqueta'}
                </button>
              ))}
            </div>
          </div>

          {/* Choices editor */}
          <ChoicesEditor
            choices={form.choices}
            onChange={choices => setForm(f => ({ ...f, choices }))}
            menuItems={menuItems}
          />

          {/* Visible toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setForm(f => ({ ...f, visible: !f.visible }))}
              style={{ width:36, height:20, borderRadius:999, border:'none',
                background: form.visible ? '#F26419' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:3, left: form.visible ? 17 : 3, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
            </button>
            <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>
              {form.visible ? 'Visible en el menú' : 'Oculta'}
            </span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:999, border:'1.5px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving || !form.name.trim() || !form.price}
            style={{ flex:2, padding:'11px', borderRadius:999, border:'none', background:'#F26419', color:'#fff',
              fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16,
              cursor: (saving || !form.name.trim() || !form.price) ? 'not-allowed' : 'pointer',
              opacity: (saving || !form.name.trim() || !form.price) ? 0.6 : 1 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PromotionsEditor ───────────────────────────────────── */

export default function PromotionsEditor({ initial, menuItems }: { initial: Promotion[]; menuItems: MenuItem[] }) {
  const [promos, setPromos] = useState<Promotion[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<Promotion | null>(null);
  const [form,     setForm]     = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

  function parseForm(f: FormState) {
    return {
      name:        f.name.trim(),
      description: f.description.trim(),
      price:       parseInt(f.price, 10) || 0,
      badge:       f.badge,
      choices:     f.choices,
      visible:     f.visible,
      imageUrl:    null as null,
      sortOrder:   0,
    };
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setError('');
  }

  function openEdit(p: Promotion) {
    setForm(toForm(p));
    setEditing(p);
    setError('');
  }

  function handleCreate() {
    setError('');
    startTransition(async () => {
      try {
        const body = parseForm(form);
        const res = await fetch('/api/admin/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, sortOrder: promos.length }),
        });
        if (!res.ok) throw new Error();
        const { id } = await res.json();
        setPromos(ps => [...ps, { ...body, id, sortOrder: ps.length }]);
        setCreating(false);
      } catch {
        setError('Error al crear. Intenta de nuevo.');
      }
    });
  }

  function handleUpdate() {
    if (!editing) return;
    setError('');
    startTransition(async () => {
      try {
        const body = parseForm(form);
        const res = await fetch(`/api/admin/promotions/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        setPromos(ps => ps.map(p => p.id === editing.id ? { ...p, ...body } : p));
        setEditing(null);
      } catch {
        setError('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  function handleToggleVisible(p: Promotion) {
    startTransition(async () => {
      const visible = !p.visible;
      await fetch(`/api/admin/promotions/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible }),
      });
      setPromos(ps => ps.map(x => x.id === p.id ? { ...x, visible } : x));
    });
  }

  function handleDelete(p: Promotion) {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/promotions/${p.id}`, { method: 'DELETE' });
      setPromos(ps => ps.filter(x => x.id !== p.id));
    });
  }

  function handleSeedExamples() {
    if (!confirm('¿Cargar las 6 promociones de ejemplo? Solo se insertan si la lista está vacía.')) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/seed-promotions', { method: 'POST' });
        const data = await res.json();
        if (data.skipped) {
          setError('Ya existen promociones — no se sobreescribieron.');
          return;
        }
        window.location.reload();
      } catch {
        setError('Error al cargar ejemplos.');
      }
    });
  }

  const BADGE_COLOR: Record<string, string> = {
    PROMO: '#F26419', OFERTA: '#dc2626', NUEVO: '#16a34a', COMBO: '#7c3aed', ESPECIAL: '#d97706',
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {error && <div style={{ fontSize:13, color:'#dc2626', fontWeight:600, marginBottom:12 }}>{error}</div>}

      {/* List */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {promos.length === 0 && (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🏷️</div>
            <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:16 }}>No hay promociones aún. Crea la primera o carga los ejemplos.</div>
            <button onClick={handleSeedExamples} disabled={isPending}
              style={{ padding:'9px 22px', borderRadius:999, border:'1.5px solid rgba(242,100,25,0.4)', background:'rgba(242,100,25,0.06)', color:'#F26419', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}>
              📋 Cargar promociones de ejemplo
            </button>
          </div>
        )}

        {promos.map(p => (
          <div key={p.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
            {/* Toggle */}
            <button onClick={() => handleToggleVisible(p)}
              style={{ flexShrink:0, marginTop:2, width:32, height:18, borderRadius:999, border:'none',
                background: p.visible ? '#F26419' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s' }}>
              <span style={{ position:'absolute', top:2, left: p.visible ? 15 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
            </button>

            <div style={{ flex:1, minWidth:0, opacity: p.visible ? 1 : 0.5 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                {p.badge && (
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:1, padding:'2px 7px', borderRadius:4,
                    background: BADGE_COLOR[p.badge] ?? '#F26419', color:'#fff' }}>
                    {p.badge}
                  </span>
                )}
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--text)' }}>{p.name}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--orange)', marginLeft:'auto' }}>{fmt(p.price)}</span>
              </div>
              {p.description && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{p.description}</div>}
              {p.choices.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {p.choices.map((c, i) => (
                    <span key={i} style={{ fontSize:11, background:'rgba(8,145,178,0.08)', color:'#0891b2', padding:'2px 7px', borderRadius:4, fontWeight:600 }}>
                      🔀 {c.label}{c.category ? ` (${CATEGORY_LABEL[c.category] ?? c.category})` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button onClick={() => openEdit(p)}
                style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                Editar
              </button>
              <button onClick={() => handleDelete(p)}
                style={{ padding:'5px 10px', borderRadius:8, border:'1px solid rgba(220,38,38,0.3)', background:'transparent', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create button */}
      <button onClick={openCreate}
        style={{ width:'100%', padding:'13px', borderRadius:999, border:'2px dashed rgba(242,100,25,0.4)',
          background:'rgba(242,100,25,0.04)', color:'#F26419',
          fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18,
          cursor:'pointer' }}>
        + Nueva promoción
      </button>

      {/* Modals */}
      {creating && (
        <PromoModal title="Nueva promoción" form={form} setForm={setForm} menuItems={menuItems}
          onSave={handleCreate} onCancel={() => setCreating(false)} saving={isPending} />
      )}
      {editing && (
        <PromoModal title="Editar promoción" form={form} setForm={setForm} menuItems={menuItems}
          onSave={handleUpdate} onCancel={() => setEditing(null)} saving={isPending} />
      )}
    </div>
  );
}
