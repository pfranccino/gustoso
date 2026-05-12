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
  selectedItems: string[];
  customItems: string;
  choices: PromoChoice[];
  visible: boolean;
};

const EMPTY_FORM: FormState = {
  name: '', description: '', price: '', badge: 'PROMO',
  selectedItems: [], customItems: '', choices: [], visible: true,
};

function toForm(p: Promotion, menuItems: MenuItem[]): FormState {
  const menuNames = new Set(menuItems.map(m => m.name));
  const selected  = p.items.filter(it => menuNames.has(it));
  const custom    = p.items.filter(it => !menuNames.has(it)).join('\n');
  return {
    name:          p.name,
    description:   p.description,
    price:         p.price > 0 ? String(p.price) : '',
    badge:         p.badge,
    selectedItems: selected,
    customItems:   custom,
    choices:       p.choices ?? [],
    visible:       p.visible,
  };
}

function buildItemsList(f: FormState): string[] {
  const custom = f.customItems.split('\n').map(s => s.trim()).filter(Boolean);
  return [...f.selectedItems, ...custom];
}

/* ── ChoicesEditor ──────────────────────────────────────── */

function ChoicesEditor({ choices, onChange, menuItems }: { choices: PromoChoice[]; onChange: (v: PromoChoice[]) => void; menuItems: MenuItem[] }) {
  const [newLabel,    setNewLabel]    = useState('');
  const [newCategory, setNewCategory] = useState('');   // '' = manual
  const [newOptions,  setNewOptions]  = useState('');   // para modo manual
  const [newRequired, setNewRequired] = useState(true);

  // Preview de opciones según categoría seleccionada
  const categoryPreview = newCategory
    ? menuItems.filter(m => m.category === newCategory && m.visible).map(m => m.volume ? `${m.name} ${m.volume}` : m.name)
    : [];

  function addChoice() {
    const label = newLabel.trim() || (newCategory ? (CATEGORY_LABEL[newCategory] ?? newCategory) : '');
    if (!label) return;
    if (newCategory) {
      // Opción basada en categoría — opciones se resuelven en tiempo real
      onChange([...choices, { label, category: newCategory, options: [], required: newRequired }]);
    } else {
      const options = newOptions.split(',').map(s => s.trim()).filter(Boolean);
      if (options.length === 0) return;
      onChange([...choices, { label, category: null, options, required: newRequired }]);
    }
    setNewLabel(''); setNewCategory(''); setNewOptions(''); setNewRequired(true);
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
        const preview = c.category
          ? menuItems.filter(m => m.category === c.category && m.visible).map(m => m.volume ? `${m.name} ${m.volume}` : m.name)
          : c.options;
        return (
          <div key={i} style={{ background:'rgba(242,100,25,0.05)', border:'1.5px solid rgba(242,100,25,0.2)', borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div>
                <span style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{c.label}</span>
                {c.category && <span style={{ fontSize:10, color:'#0891b2', marginLeft:6, fontWeight:700, background:'rgba(8,145,178,0.1)', padding:'1px 6px', borderRadius:4 }}>📋 {CATEGORY_LABEL[c.category] ?? c.category}</span>}
                {c.required && <span style={{ fontSize:10, color:'#dc2626', marginLeft:4, fontWeight:700 }}>REQUERIDO</span>}
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

        {/* Fuente: Categoría del menú o manual */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6 }}>Fuente de opciones</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: newCategory ? 8 : 0 }}>
            <button onClick={() => setNewCategory('')}
              style={{ padding:'5px 12px', borderRadius:999, border:`2px solid ${!newCategory ? '#F26419' : 'rgba(242,100,25,0.25)'}`, background: !newCategory ? '#F26419' : 'transparent', color: !newCategory ? '#fff' : '#A0541A', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ✏️ Manual
            </button>
            {CHOICE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { setNewCategory(cat.id); setNewLabel(l => l || cat.label.replace(/^[^ ]+ /, '')); }}
                style={{ padding:'5px 12px', borderRadius:999, border:`2px solid ${newCategory === cat.id ? '#0891b2' : 'rgba(8,145,178,0.2)'}`, background: newCategory === cat.id ? '#0891b2' : 'transparent', color: newCategory === cat.id ? '#fff' : '#0891b2', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Preview de items de la categoría seleccionada */}
          {newCategory && categoryPreview.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, padding:'8px 10px', background:'rgba(8,145,178,0.05)', borderRadius:6, border:'1px solid rgba(8,145,178,0.15)' }}>
              {categoryPreview.map(opt => (
                <span key={opt} style={{ fontSize:11, color:'#0891b2', fontWeight:600 }}>{opt}</span>
              ))}
            </div>
          )}
          {newCategory && categoryPreview.length === 0 && (
            <div style={{ fontSize:11, color:'#999', fontStyle:'italic', padding:'4px 0' }}>No hay items visibles en esta categoría aún</div>
          )}
        </div>

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

/* ── ItemPicker ─────────────────────────────────────────── */

function ItemPicker({
  menuItems,
  selected,
  onChange,
}: {
  menuItems: MenuItem[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const visible = menuItems.filter(m => m.visible);
  const filtered = search.trim()
    ? visible.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : visible;

  // Group by category
  const groups: Record<string, MenuItem[]> = {};
  for (const m of filtered) {
    (groups[m.category] ??= []).push(m);
  }

  function toggle(name: string) {
    onChange(
      selected.includes(name)
        ? selected.filter(s => s !== name)
        : [...selected, name],
    );
  }

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar producto…"
        style={{ ...INPUT, marginBottom: 8 }}
      />
      <div style={{ maxHeight: 220, overflowY: 'auto', border: '1.5px solid rgba(242,100,25,0.18)', borderRadius: 8, background: '#fff' }}>
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#A0541A', letterSpacing: 1, textTransform: 'uppercase', padding: '7px 12px 3px', background: 'rgba(242,100,25,0.04)', borderBottom: '1px solid rgba(242,100,25,0.08)' }}>
              {CATEGORY_LABEL[cat] ?? cat}
            </div>
            {items.map(m => {
              const sel = selected.includes(m.name);
              return (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', background: sel ? 'rgba(242,100,25,0.06)' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background .1s' }}>
                  <input type="checkbox" checked={sel} onChange={() => toggle(m.name)}
                    style={{ accentColor: '#F26419', width: 15, height: 15, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? '#1A0800' : '#555' }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: '#A0541A', fontWeight: 600 }}>
                    {m.priceNormal != null
                      ? `$${m.priceNormal.toLocaleString('es-CL')} / $${m.priceXL!.toLocaleString('es-CL')}`
                      : `$${(m.price ?? 0).toLocaleString('es-CL')}`}
                  </span>
                </label>
              );
            })}
          </div>
        ))}
        {Object.keys(groups).length === 0 && (
          <div style={{ padding: '16px', fontSize: 13, color: '#999', textAlign: 'center' }}>Sin resultados</div>
        )}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {selected.map(name => (
            <span key={name} style={{ fontSize: 11, background: 'rgba(242,100,25,0.1)', color: '#A0541A', padding: '3px 9px', borderRadius: 4, fontWeight: 700 }}>
              ✓ {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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

          {/* Products picker */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>
              Productos incluidos
            </label>
            <ItemPicker
              menuItems={menuItems}
              selected={form.selectedItems}
              onChange={selectedItems => setForm(f => ({ ...f, selectedItems }))}
            />
          </div>

          {/* Custom items (extras not in menu) */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>
              Extras no listados en el menú <span style={{ fontWeight:400, textTransform:'none', fontSize:11 }}>(opcional, uno por línea)</span>
            </label>
            <textarea value={form.customItems} onChange={e => setForm(f => ({ ...f, customItems: e.target.value }))}
              placeholder={"Bebida 500ml\nAliño especial"} rows={3}
              style={{ ...INPUT, resize:'vertical', lineHeight:1.5 }} />
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
      items:       buildItemsList(f),
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
    setForm(toForm(p, menuItems));
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
              {p.items.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {p.items.map((it, i) => (
                    <span key={i} style={{ fontSize:11, background:'rgba(242,100,25,0.08)', color:'#A0541A', padding:'2px 7px', borderRadius:4, fontWeight:600 }}>✓ {it}</span>
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
