'use client';

import { useState, useTransition, useRef, useImperativeHandle, forwardRef } from 'react';
import { MenuItem, Extra, Ingredient } from '@/lib/firestore/menuItems';
import type { Category } from '@/lib/firestore/categoriesTypes';
import { DEFAULT_CATEGORIES } from '@/lib/firestore/categoriesTypes';

const VOLUMES = ['237ml', '330ml', '350ml', '400ml', '500ml', '600ml', '1L', '1.5L', '2L', '3L'];

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

/* ── tipos locales ─────────────────────────────── */

type EditState = {
  item: MenuItem;
  name: string;
  desc: string;
  hasVolume: boolean;
  volume: string;
  price: string;
  priceNormal: string;
  priceXL: string;
  costEstimado: string;
  extras: Extra[];
  ingredients: Ingredient[];
};

type CreateState = {
  category: string;
  name: string;
  desc: string;
  hasVolume: boolean;
  volume: string;
  dual: boolean;
  price: string;
  priceNormal: string;
  priceXL: string;
  costEstimado: string;
  extras: Extra[];
  ingredients: Ingredient[];
  visible: boolean;
};

const emptyCreate = (firstCat = 'vienesas'): CreateState => ({
  category: firstCat, name: '', desc: '', hasVolume: false, volume: '', dual: false,
  price: '', priceNormal: '', priceXL: '', costEstimado: '', extras: [], ingredients: [], visible: true,
});

/* ── componente principal ─────────────────────── */

export default function MenuEditor({ initialItems, categories = DEFAULT_CATEGORIES }: { initialItems: MenuItem[]; categories?: Category[] }) {
  // Solo categorías que pueden tener items (excluye promos, burrito especial, bebidas ocultas)
  const editableCategories = categories.filter(c => !c.special && c.id !== 'promos');

  const [items, setItems]       = useState<MenuItem[]>(initialItems);
  const [editing, setEditing]   = useState<EditState | null>(null);
  const [creating, setCreating] = useState<CreateState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [seeding,    setSeeding]    = useState(false);
  const [seedMsg,    setSeedMsg]    = useState('');
  const [migrating,  setMigrating]  = useState(false);
  const [migrateMsg, setMigrateMsg] = useState('');
  const [isPending, startTransition] = useTransition();
  const editExtrasRef         = useRef<ExtrasHandle>(null);
  const createExtrasRef       = useRef<ExtrasHandle>(null);
  const editIngredientsRef    = useRef<IngredientsHandle>(null);
  const createIngredientsRef  = useRef<IngredientsHandle>(null);

  /* ── helpers ──────────────────────────────────── */

  async function patchItem(id: string, update: Partial<MenuItem>) {
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

  /* ── visible toggle ───────────────────────────── */

  function toggleVisible(item: MenuItem) {
    const next = !item.visible;
    applyLocal(item.id, { visible: next });
    patchItem(item.id, { visible: next }).catch(() => applyLocal(item.id, { visible: item.visible }));
  }

  /* ── edit modal ───────────────────────────────── */

  function openEdit(item: MenuItem) {
    setEditing({
      item,
      name:         item.name,
      desc:         item.desc ?? '',
      hasVolume:    !!(item.volume),
      volume:       item.volume ?? '',
      price:        item.price != null ? String(item.price) : '',
      priceNormal:  item.priceNormal != null ? String(item.priceNormal) : '',
      priceXL:      item.priceXL != null ? String(item.priceXL) : '',
      costEstimado: item.costEstimado != null ? String(item.costEstimado) : '',
      extras:       item.extras ?? [],
      ingredients:  item.ingredients ?? [],
    });
    setSaveError('');
  }

  function handleSave() {
    if (!editing) return;
    editExtrasRef.current?.flush();
    editIngredientsRef.current?.flush();
    const { item } = editing;
    const isDual = item.priceNormal != null;

    const update: Partial<MenuItem> = {
      name:         editing.name.trim() || item.name,
      desc:         editing.desc.trim() || null,
      volume:       editing.hasVolume ? (editing.volume.trim() || null) : null,
      costEstimado: editing.costEstimado.trim() ? (parseInt(editing.costEstimado, 10) || null) : null,
      extras:       editing.extras,
      ingredients:  editing.ingredients,
    };

    if (isDual) {
      update.priceNormal = parseInt(editing.priceNormal, 10) || item.priceNormal!;
      update.priceXL     = parseInt(editing.priceXL,     10) || item.priceXL!;
    } else {
      update.price = parseInt(editing.price, 10) || item.price!;
    }

    startTransition(async () => {
      try {
        await patchItem(item.id, update);
        applyLocal(item.id, update);
        setEditing(null); setSaveError('');
      } catch {
        setSaveError('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  /* ── delete ───────────────────────────────────── */

  async function handleDelete(item: MenuItem) {
    if (!confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return;
    applyLocal(item.id, { visible: false });
    try {
      await fetch(`/api/menu/${item.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(it => it.id !== item.id));
    } catch {
      applyLocal(item.id, { visible: item.visible });
    }
  }

  /* ── create ───────────────────────────────────── */

  function handleCreate() {
    if (!creating) return;
    createExtrasRef.current?.flush();
    createIngredientsRef.current?.flush();
    const { category, name, desc, hasVolume, volume, dual, price, priceNormal, priceXL, extras, ingredients, visible } = creating;
    if (!name.trim()) { setSaveError('El nombre es obligatorio.'); return; }

    startTransition(async () => {
      try {
        const { costEstimado } = creating;
        const resolvedVolume = hasVolume ? (volume.trim() || null) : null;
        const body: Record<string, unknown> = { category, name: name.trim(), desc: desc.trim() || null, volume: resolvedVolume, costEstimado: costEstimado.trim() ? (parseInt(costEstimado, 10) || null) : null, extras, ingredients, visible };
        if (dual) {
          body.priceNormal = parseInt(priceNormal, 10) || 0;
          body.priceXL     = parseInt(priceXL,     10) || 0;
        } else {
          body.price = parseInt(price, 10) || 0;
        }
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const { id } = await res.json();
        const newItem: MenuItem = {
          id,
          category,
          name: name.trim(),
          desc: desc.trim() || null,
          volume: volume.trim() || null,
          price: dual ? null : (parseInt(price, 10) || 0),
          priceNormal: dual ? (parseInt(priceNormal, 10) || 0) : null,
          priceXL:     dual ? (parseInt(priceXL,     10) || 0) : null,
          imageUrl: null,
          visible,
          sortOrder: items.filter(i => i.category === category).length,
          costEstimado: creating.costEstimado.trim() ? (parseInt(creating.costEstimado, 10) || null) : null,
          extras,
          ingredients,
        };
        setItems(prev => [...prev, newItem]);
        setCreating(null); setSaveError('');
      } catch {
        setSaveError('Error al crear el producto. Intenta de nuevo.');
      }
    });
  }

  /* ── migrate ingredients ─────────────────────── */

  async function handleMigrateIngredients() {
    if (!confirm('Esto leerá el campo "descripción" de cada producto en Firestore, lo convertirá en ingredientes y borrará la descripción. ¿Continuar?')) return;
    setMigrating(true); setMigrateMsg('');
    try {
      const res  = await fetch('/api/admin/migrate-ingredients', { method: 'POST' });
      const data = await res.json();
      setMigrateMsg(`✓ ${data.migrated} producto${data.migrated !== 1 ? 's' : ''} migrado${data.migrated !== 1 ? 's' : ''}. Recarga la página.`);
    } catch { setMigrateMsg('Error al migrar.'); }
    setMigrating(false);
  }

  /* ── seed ─────────────────────────────────────── */

  async function handleSeed() {
    setSeeding(true); setSeedMsg('');
    try {
      const res  = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      setSeedMsg(data.seeded ? `✓ Menú importado (${data.count} items). Recarga la página.` : 'El menú ya tiene datos, no se sobreescribió.');
    } catch { setSeedMsg('Error al importar.'); }
    setSeeding(false);
  }

  /* ── agrupar por categoría ───────────────────── */

  const byCategory = items.reduce<Record<string, MenuItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  const isDual = (it: MenuItem) => it.priceNormal != null;

  /* ── render ───────────────────────────────────── */

  return (
    <>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <button
          onClick={() => { setCreating(emptyCreate(editableCategories[0]?.id ?? 'vienesas')); setSaveError(''); }}
          style={{ padding:'9px 18px', borderRadius:999, border:'none', background:'#F26419', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}
        >
          + Crear producto
        </button>
        <button
          onClick={handleSeed} disabled={seeding}
          style={{ padding:'9px 18px', borderRadius:999, border:'1.5px solid #F26419', background:'transparent', color:'#F26419', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor: seeding?'not-allowed':'pointer', opacity: seeding?0.6:1 }}
        >
          {seeding ? 'Importando…' : 'Importar menú inicial'}
        </button>
        <button
          onClick={handleMigrateIngredients} disabled={migrating}
          style={{ padding:'9px 18px', borderRadius:999, border:'1.5px solid #6b7280', background:'transparent', color:'#6b7280', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor: migrating?'not-allowed':'pointer', opacity: migrating?0.6:1 }}
        >
          {migrating ? 'Migrando…' : '🥬 Migrar ingredientes'}
        </button>
        {seedMsg    && <span style={{ fontSize:13, color:'#A0541A', fontWeight:600 }}>{seedMsg}</span>}
        {migrateMsg && <span style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>{migrateMsg}</span>}
      </div>

      {/* Category sections */}
      {editableCategories.map(({ id: cat, label, emoji }) => {
        const catItems = byCategory[cat];
        if (!catItems?.length) return null;
        return (
          <div key={cat} style={{ marginBottom:32 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'var(--text)', marginBottom:12, borderBottom:'1.5px solid var(--border)', paddingBottom:8 }}>
              {emoji} {label}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:8 }}>
              {catItems.map(item => (
                <div key={item.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 14px', display:'flex', alignItems:'center', gap:12, opacity: item.visible ? 1 : 0.5 }}>
                  <button onClick={() => toggleVisible(item)} title={item.visible?'Ocultar':'Mostrar'}
                    style={{ flexShrink:0, width:36, height:20, borderRadius:999, border:'none', background: item.visible?'#F26419':'#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s' }}>
                    <span style={{ position:'absolute', top:2, left: item.visible?18:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                  </button>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                      {item.volume && <span style={{ fontSize:10, fontWeight:700, color:'#0891b2', background:'rgba(8,145,178,0.1)', padding:'1px 6px', borderRadius:4, flexShrink:0 }}>🥤 {item.volume}</span>}
                    </div>
                    {item.desc && <div style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.desc}</div>}
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {item.ingredients.length > 0 && (() => { const en = item.ingredients.filter(i => i.enabled).length; const tot = item.ingredients.length; return <div style={{ fontSize:11, color: en < tot ? '#d97706' : 'var(--text-muted)', fontWeight:600 }}>🥬 {en < tot ? `${en}/${tot}` : tot} ingrediente{tot > 1 ? 's' : ''}</div>; })()}
                      {item.extras.length > 0 && <div style={{ fontSize:11, color:'var(--orange)', fontWeight:600 }}>➕ {item.extras.length} extra{item.extras.length > 1 ? 's' : ''}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--orange)', whiteSpace:'nowrap' }}>
                      {isDual(item) ? `${fmt(item.priceNormal!)} / ${fmt(item.priceXL!)}` : fmt(item.price!)}
                    </div>
                    {item.costEstimado != null && (() => {
                      const ref = item.price ?? item.priceNormal ?? 0;
                      const margin = ref > 0 ? Math.round((ref - item.costEstimado) / ref * 100) : 0;
                      const color = margin >= 60 ? '#16a34a' : margin >= 40 ? '#d97706' : '#dc2626';
                      return <div style={{ fontSize:11, fontWeight:700, color, whiteSpace:'nowrap' }}>Margen {margin}%</div>;
                    })()}
                  </div>
                  <button onClick={() => openEdit(item)} style={{ flexShrink:0, padding:'5px 12px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', fontSize:12, fontWeight:700, color:'var(--text-muted)', cursor:'pointer' }}>Editar</button>
                  <button onClick={() => handleDelete(item)} style={{ flexShrink:0, padding:'5px 10px', borderRadius:6, border:'1px solid rgba(220,38,38,0.3)', background:'transparent', fontSize:12, fontWeight:700, color:'#dc2626', cursor:'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Edit modal */}
      {editing && (
        <Modal title="Editar producto" onClose={() => { setEditing(null); setSaveError(''); }}>
          <Field label="Nombre" value={editing.name} onChange={e => setEditing(p => p && ({ ...p, name: e.target.value }))} />
          <Field label="Descripción" value={editing.desc} placeholder="(opcional)" onChange={e => setEditing(p => p && ({ ...p, desc: e.target.value }))} />
          <VolumeToggle hasVolume={editing.hasVolume} volume={editing.volume}
            onToggle={v => setEditing(p => p && ({ ...p, hasVolume: v }))}
            onVolume={v => setEditing(p => p && ({ ...p, volume: v }))} />
          {isDual(editing.item) ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Precio Normal" type="number" value={editing.priceNormal} onChange={e => setEditing(p => p && ({ ...p, priceNormal: e.target.value }))} />
              <Field label="Precio XL" type="number" value={editing.priceXL} onChange={e => setEditing(p => p && ({ ...p, priceXL: e.target.value }))} />
            </div>
          ) : (
            <Field label="Precio" type="number" value={editing.price} onChange={e => setEditing(p => p && ({ ...p, price: e.target.value }))} />
          )}
          <CostField value={editing.costEstimado} onChange={v => setEditing(p => p && ({ ...p, costEstimado: v }))}
            refPrice={editing.item.price ?? editing.item.priceNormal ?? null} />
          <IngredientsEditor ref={editIngredientsRef} ingredients={editing.ingredients} onChange={ingredients => setEditing(p => p && ({ ...p, ingredients }))} />
          <ExtrasEditor ref={editExtrasRef} extras={editing.extras} onChange={extras => setEditing(p => p && ({ ...p, extras }))} />
          {saveError && <div style={{ fontSize:13, color:'#dc2626', fontWeight:600, marginBottom:12 }}>{saveError}</div>}
          <ModalActions onSave={handleSave} onCancel={() => { setEditing(null); setSaveError(''); }} isPending={isPending} />
        </Modal>
      )}

      {/* Create modal */}
      {creating && (
        <Modal title="Crear producto" onClose={() => { setCreating(null); setSaveError(''); }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#A0541A', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Categoría</label>
            <select value={creating.category} onChange={e => setCreating(p => p && ({ ...p, category: e.target.value }))}
              style={{ display:'block', width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:14, fontFamily:"'Barlow',sans-serif" }}>
              {editableCategories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <Field label="Nombre" value={creating.name} onChange={e => setCreating(p => p && ({ ...p, name: e.target.value }))} />
          <Field label="Descripción" value={creating.desc} placeholder="(opcional)" onChange={e => setCreating(p => p && ({ ...p, desc: e.target.value }))} />
          <VolumeToggle hasVolume={creating.hasVolume} volume={creating.volume}
            onToggle={v => setCreating(p => p && ({ ...p, hasVolume: v }))}
            onVolume={v => setCreating(p => p && ({ ...p, volume: v }))} />

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#1A0800' }}>
              <input type="checkbox" checked={creating.dual} onChange={e => setCreating(p => p && ({ ...p, dual: e.target.checked }))} />
              Tiene precio Normal / XL
            </label>
          </div>

          {creating.dual ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Precio Normal" type="number" value={creating.priceNormal} onChange={e => setCreating(p => p && ({ ...p, priceNormal: e.target.value }))} />
              <Field label="Precio XL" type="number" value={creating.priceXL} onChange={e => setCreating(p => p && ({ ...p, priceXL: e.target.value }))} />
            </div>
          ) : (
            <Field label="Precio" type="number" value={creating.price} onChange={e => setCreating(p => p && ({ ...p, price: e.target.value }))} />
          )}

          <CostField value={creating.costEstimado} onChange={v => setCreating(p => p && ({ ...p, costEstimado: v }))}
            refPrice={creating.dual ? (parseInt(creating.priceNormal, 10) || null) : (parseInt(creating.price, 10) || null)} />
          <IngredientsEditor ref={createIngredientsRef} ingredients={creating.ingredients} onChange={ingredients => setCreating(p => p && ({ ...p, ingredients }))} />
          <ExtrasEditor ref={createExtrasRef} extras={creating.extras} onChange={extras => setCreating(p => p && ({ ...p, extras }))} />

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#1A0800' }}>
              <input type="checkbox" checked={creating.visible} onChange={e => setCreating(p => p && ({ ...p, visible: e.target.checked }))} />
              Visible en el menú
            </label>
          </div>

          {saveError && <div style={{ fontSize:13, color:'#dc2626', fontWeight:600, marginBottom:12 }}>{saveError}</div>}
          <ModalActions onSave={handleCreate} onCancel={() => { setCreating(null); setSaveError(''); }} isPending={isPending} saveLabel="Crear" />
        </Modal>
      )}
    </>
  );
}

/* ── sub-componentes ──────────────────────────── */

function VolumeToggle({ hasVolume, volume, onToggle, onVolume }: {
  hasVolume: boolean; volume: string;
  onToggle: (v: boolean) => void; onVolume: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom: hasVolume ? 12 : 0 }}>
        <input type="checkbox" checked={hasVolume} onChange={e => onToggle(e.target.checked)} style={{ width:15, height:15, cursor:'pointer' }}/>
        <span style={{ fontSize:13, fontWeight:600, color:'#1A0800' }}>Tiene volumen / capacidad (ml, L…)</span>
      </label>

      {hasVolume && (
        <>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
            {VOLUMES.map(v => (
              <button key={v} type="button" onClick={() => onVolume(volume === v ? '' : v)}
                style={{ padding:'4px 10px', borderRadius:999, border:`1.5px solid ${volume === v ? '#0891b2' : 'rgba(0,0,0,0.15)'}`, background: volume === v ? 'rgba(8,145,178,0.1)' : 'transparent', color: volume === v ? '#0891b2' : '#666', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                {v}
              </button>
            ))}
          </div>
          <input
            value={volume} onChange={e => onVolume(e.target.value)}
            placeholder="O escribe otro valor…"
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }}
          />
        </>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:14, padding:'28px 24px', width:'100%', maxWidth:440, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', maxHeight:'90vh', overflowY:'auto' }}>
        <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'#1A0800', marginBottom:20 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onSave, onCancel, isPending, saveLabel = 'Guardar' }: { onSave: () => void; onCancel: () => void; isPending: boolean; saveLabel?: string }) {
  return (
    <div style={{ display:'flex', gap:10, marginTop:20 }}>
      <button onClick={onSave} disabled={isPending} style={{ flex:1, padding:'12px', borderRadius:999, border:'none', background: isPending?'#d1bfb8':'#F26419', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor: isPending?'not-allowed':'pointer' }}>
        {isPending ? 'Guardando…' : saveLabel}
      </button>
      <button onClick={onCancel} style={{ padding:'12px 20px', borderRadius:999, border:'1.5px solid var(--border)', background:'transparent', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', color:'var(--text-muted)' }}>
        Cancelar
      </button>
    </div>
  );
}

type IngredientsHandle = { flush: () => void };

const IngredientsEditor = forwardRef<IngredientsHandle, { ingredients: Ingredient[]; onChange: (v: Ingredient[]) => void }>(
function IngredientsEditor({ ingredients, onChange }, ref) {
  const [newName, setNewName] = useState('');

  const add = () => {
    const name = newName.trim();
    if (!name || ingredients.some(i => i.name === name)) return;
    onChange([...ingredients, { name, enabled: true }]);
    setNewName('');
  };

  const toggle = (idx: number) => {
    onChange(ingredients.map((ing, i) => i === idx ? { ...ing, enabled: !ing.enabled } : ing));
  };

  useImperativeHandle(ref, () => ({ flush: () => { if (newName.trim()) add(); } }));

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#A0541A', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
        Ingredientes
      </div>
      <div style={{ fontSize:11, color:'#999', marginBottom:8 }}>
        Activos = visibles al cliente · Desactivados = ocultos (sin perderlos)
      </div>

      {ingredients.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
          {ingredients.map((ing, i) => (
            <button key={i} onClick={() => toggle(i)}
              title={ing.enabled ? 'Clic para desactivar' : 'Clic para activar'}
              style={{ display:'inline-flex', alignItems:'center', gap:6, borderRadius:999, padding:'5px 12px', fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', transition:'all .15s',
                background:     ing.enabled ? '#FFF9F5'               : 'rgba(0,0,0,0.04)',
                borderColor:    ing.enabled ? 'rgba(242,100,25,0.35)' : 'rgba(0,0,0,0.12)',
                color:          ing.enabled ? '#1A0800'               : '#aaa',
                textDecoration: ing.enabled ? 'none'                  : 'line-through',
              }}>
              <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background: ing.enabled ? '#F26419' : '#d1d5db', transition:'background .15s' }}/>
              {ing.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:8 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Ej: ketchup, cebolla, tomate…"
          style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:13, fontFamily:"'Barlow',sans-serif" }} />
        <button onClick={add} style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#F26419', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+</button>
      </div>
    </div>
  );
});

type ExtrasHandle = { flush: () => void };

const ExtrasEditor = forwardRef<ExtrasHandle, { extras: Extra[]; onChange: (e: Extra[]) => void }>(
function ExtrasEditor({ extras, onChange }, ref) {
  const [newName,  setNewName]  = useState('');
  const [newPrice, setNewPrice] = useState('');

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    onChange([...extras, { name, price: parseInt(newPrice, 10) || 0 }]);
    setNewName(''); setNewPrice('');
  };

  useImperativeHandle(ref, () => ({ flush: () => { if (newName.trim()) add(); } }));

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#A0541A', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Extras opcionales</div>

      {extras.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
          {extras.map((e, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FFF9F5', border:'1px solid rgba(242,100,25,0.2)', borderRadius:8, padding:'7px 12px' }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#1A0800' }}>{e.name}</span>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color: e.price > 0 ? '#F26419' : '#16a34a' }}>{e.price > 0 ? `+$${e.price.toLocaleString('es-CL')}` : 'Gratis'}</span>
                <button onClick={() => onChange(extras.filter((_, j) => j !== i))} style={{ fontSize:14, color:'#dc2626', background:'transparent', border:'none', cursor:'pointer', fontWeight:700, lineHeight:1 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:8 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Nombre del extra" style={{ flex:2, padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:13, fontFamily:"'Barlow',sans-serif" }} />
        <input value={newPrice} onChange={e => setNewPrice(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Precio (0=gratis)" type="number" style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:13, fontFamily:"'Barlow',sans-serif" }} />
        <button onClick={add} style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'#F26419', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>+</button>
      </div>
    </div>
  );
});

function CostField({ value, onChange, refPrice }: { value: string; onChange: (v: string) => void; refPrice: number | null }) {
  const cost   = parseInt(value, 10);
  const margin = refPrice && refPrice > 0 && !isNaN(cost) && cost > 0
    ? Math.round((refPrice - cost) / refPrice * 100) : null;
  const marginColor = margin === null ? '#999' : margin >= 60 ? '#16a34a' : margin >= 40 ? '#d97706' : '#dc2626';

  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#A0541A', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
        Costo estimado <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, fontSize:10, color:'#999' }}>(opcional — para calcular margen)</span>
      </label>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input
          value={value} onChange={e => onChange(e.target.value)} type="number" placeholder="$0"
          style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:14, fontFamily:"'Barlow',sans-serif", boxSizing:'border-box', outline:'none' }}
        />
        {margin !== null && (
          <div style={{ flexShrink:0, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color: marginColor }}>
            Margen {margin}%
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, ...inputProps }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#A0541A', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>{label}</label>
      <input {...inputProps} style={{ display:'block', width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'#FFF9F5', color:'#1A0800', fontSize:14, fontFamily:"'Barlow',sans-serif", boxSizing:'border-box', outline:'none' }} />
    </div>
  );
}
