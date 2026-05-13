'use client';

import { useState, useTransition, useMemo } from 'react';
import { CostEntry, UNITS } from '@/lib/firestore/costsTypes';

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

const INPUT: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid rgba(242,100,25,0.25)',
  background: '#FFF9F5', color: '#1A0800',
  fontSize: 13, fontFamily: "'Barlow',sans-serif",
  outline: 'none', boxSizing: 'border-box', width: '100%',
};
const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#A0541A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5,
};

type FormState = { name: string; quantity: string; unit: string; totalPrice: string; date: string; notes: string };
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY: FormState = { name: '', quantity: '', unit: 'unidad', totalPrice: '', date: today(), notes: '' };

function calcUnit(qty: string, total: string): number | null {
  const q = parseFloat(qty), t = parseFloat(total);
  if (!q || !t || q <= 0) return null;
  return t / q;
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function daysBetween(a: string, b: string): number {
  return Math.abs(Math.floor((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000));
}

/* ── Vista agrupada por insumo ──────────────────── */
function InsumoCard({ name, entries, onFilter }: {
  name: string;
  entries: CostEntry[];
  onFilter: (name: string) => void;
}) {
  const sorted   = [...entries].sort((a, b) => a.date.localeCompare(b.date)); // más antiguo primero
  const latest   = sorted[sorted.length - 1];
  const prev     = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
  const totalSpent = entries.reduce((s, e) => s + e.totalPrice, 0);
  const avgDays  = sorted.length >= 2
    ? Math.round(sorted.slice(1).reduce((s, e, i) => s + daysBetween(sorted[i].date, e.date), 0) / (sorted.length - 1))
    : null;
  const ago      = daysAgo(latest.date);
  const priceDiff = prev ? ((latest.unitPrice - prev.unitPrice) / prev.unitPrice) * 100 : null;

  const trend = priceDiff === null ? null
    : priceDiff > 2  ? { icon:'↑', color:'#dc2626', label:`+${priceDiff.toFixed(1)}%` }
    : priceDiff < -2 ? { icon:'↓', color:'#16a34a', label:`${priceDiff.toFixed(1)}%` }
    : { icon:'→', color:'#f59e0b', label:'Estable' };

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)' }}>{name}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
            {entries.length} compra{entries.length !== 1 ? 's' : ''} · Total gastado: <strong style={{ color:'var(--orange)' }}>{fmt(totalSpent)}</strong>
          </div>
        </div>
        <button onClick={() => onFilter(name)}
          style={{ fontSize:11, color:'var(--orange)', background:'rgba(242,100,25,0.08)', border:'1px solid rgba(242,100,25,0.2)', borderRadius:6, padding:'3px 10px', cursor:'pointer', fontWeight:700, whiteSpace:'nowrap' }}>
          Ver historial
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
        {/* Precio unitario actual */}
        <Stat label={`Precio / ${latest.unit}`} value={fmt(latest.unitPrice)}
          sub={trend ? <span style={{ color:trend.color, fontWeight:700, fontSize:11 }}>{trend.icon} {trend.label} vs anterior</span> : undefined}/>

        {/* Última compra */}
        <Stat label="Última compra"
          value={ago === 0 ? 'Hoy' : ago === 1 ? 'Ayer' : `Hace ${ago}d`}
          sub={<span style={{ color:'var(--text-muted)', fontSize:11 }}>{latest.date}</span>}/>

        {/* Frecuencia */}
        {avgDays !== null && (
          <Stat label="Frecuencia" value={`~${avgDays}d`} sub={<span style={{ color:'var(--text-muted)', fontSize:11 }}>entre compras</span>}/>
        )}

        {/* Próxima estimada */}
        {avgDays !== null && (
          <Stat label="Próxima estimada" value={(() => {
            const next = new Date(latest.date);
            next.setDate(next.getDate() + avgDays);
            const diff = Math.ceil((next.getTime() - Date.now()) / 86_400_000);
            return diff <= 0 ? 'Vencida' : `En ${diff}d`;
          })()} sub={<span style={{ color:'var(--text-muted)', fontSize:11 }}>
            {(() => {
              const next = new Date(latest.date);
              next.setDate(next.getDate() + avgDays);
              return next.toLocaleDateString('es-CL');
            })()}
          </span>}/>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div style={{ background:'var(--bg2)', borderRadius:8, padding:'10px 12px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--text)' }}>{value}</div>
      {sub && <div style={{ marginTop:2 }}>{sub}</div>}
    </div>
  );
}

/* ── Editor principal ───────────────────────────── */
export default function CostsEditor({ initial }: { initial: CostEntry[] }) {
  const [items,      setItems]      = useState<CostEntry[]>(initial);
  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [error,      setError]      = useState('');
  const [isPending,  startTransition] = useTransition();
  const [view,       setView]       = useState<'insumos' | 'historial'>('insumos');
  const [filterName, setFilterName] = useState<string | null>(null);

  const unitPreview = calcUnit(form.quantity, form.totalPrice);
  const totalSpent  = items.reduce((s, c) => s + c.totalPrice, 0);

  /* agrupar por insumo (case-insensitive, trimmed) */
  const grouped = useMemo(() => {
    const map = new Map<string, CostEntry[]>();
    items.forEach(c => {
      const key = c.name.trim().toLowerCase();
      const canonical = c.name.trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ...c, name: canonical });
    });
    // ordenar por fecha de última compra desc
    return Array.from(map.entries())
      .map(([, entries]) => ({ name: entries[0].name, entries }))
      .sort((a, b) => {
        const la = Math.max(...a.entries.map(e => new Date(e.date).getTime()));
        const lb = Math.max(...b.entries.map(e => new Date(e.date).getTime()));
        return lb - la;
      });
  }, [items]);

  /* historial filtrado */
  const historialItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
    if (!filterName) return sorted;
    return sorted.filter(c => c.name.trim().toLowerCase() === filterName.trim().toLowerCase());
  }, [items, filterName]);

  /* nombres únicos para autocomplete */
  const knownNames = useMemo(() => Array.from(new Set(items.map(c => c.name.trim()))).sort(), [items]);

  function openEdit(c: CostEntry) {
    setEditId(c.id);
    setForm({ name:c.name, quantity:String(c.quantity), unit:c.unit, totalPrice:String(c.totalPrice), date:c.date, notes:c.notes });
    setError('');
    setView('historial');
  }

  function cancelEdit() { setEditId(null); setForm(EMPTY); setError(''); }

  function handleSave() {
    const name = form.name.trim();
    if (!name)                    { setError('El nombre es requerido'); return; }
    const quantity   = parseFloat(form.quantity)   || 0;
    const totalPrice = parseFloat(form.totalPrice) || 0;
    if (quantity <= 0)   { setError('La cantidad debe ser mayor a 0'); return; }
    if (totalPrice <= 0) { setError('El precio total debe ser mayor a 0'); return; }
    const unitPrice = Math.round((totalPrice / quantity) * 100) / 100;
    setError('');
    startTransition(async () => {
      try {
        const body = { name, quantity, unit:form.unit as CostEntry['unit'], totalPrice, unitPrice, date:form.date, notes:form.notes.trim() };
        if (editId) {
          await fetch(`/api/admin/costs/${editId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
          setItems(prev => prev.map(c => c.id === editId ? { ...c, ...body } : c));
          cancelEdit();
        } else {
          const res = await fetch('/api/admin/costs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
          const { id } = await res.json();
          setItems(prev => [{ id, ...body }, ...prev]);
          setForm(EMPTY);
        }
      } catch { setError('Error al guardar. Intenta de nuevo.'); }
    });
  }

  function handleDelete(c: CostEntry) {
    if (!confirm(`¿Eliminar registro de "${c.name}" del ${c.date}?`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/costs/${c.id}`, { method:'DELETE' });
      setItems(prev => prev.filter(x => x.id !== c.id));
    });
  }

  return (
    <div style={{ maxWidth:780 }}>

      {/* Formulario */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:16 }}>
          {editId ? '✏️ Editar registro' : '➕ Nueva compra de insumo'}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={LABEL}>Insumo / Producto</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
              list="known-names" placeholder="Ej: Pan de hot dog, Vienesas, Ketchup…" style={INPUT}/>
            <datalist id="known-names">
              {knownNames.map(n => <option key={n} value={n}/>)}
            </datalist>
          </div>
          <div>
            <label style={LABEL}>Fecha</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} style={INPUT}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <label style={LABEL}>Cantidad</label>
            <input type="number" min="0" step="any" value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity:e.target.value }))} placeholder="100" style={INPUT}/>
          </div>
          <div>
            <label style={LABEL}>Unidad</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit:e.target.value }))} style={{ ...INPUT, cursor:'pointer' }}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL}>Precio Total ($)</label>
            <input type="number" min="0" step="any" value={form.totalPrice}
              onChange={e => setForm(f => ({ ...f, totalPrice:e.target.value }))} placeholder="8500" style={INPUT}/>
          </div>
          <div>
            <label style={LABEL}>Precio Unitario</label>
            <div style={{ ...INPUT, background:'rgba(242,100,25,0.05)', border:'1.5px solid rgba(242,100,25,0.15)', display:'flex', alignItems:'center', color: unitPreview != null ? 'var(--orange)' : 'var(--text-muted)', fontWeight:700 }}>
              {unitPreview != null ? fmt(unitPreview) : '—'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={LABEL}>Notas (opcional)</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))}
            placeholder="Ej: Supermercado Líder, pack x100 unidades…" style={INPUT}/>
        </div>

        {error && <div style={{ fontSize:12, color:'#dc2626', fontWeight:600, marginBottom:10 }}>{error}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleSave} disabled={isPending || !form.name.trim()}
            style={{ flex:1, padding:10, borderRadius:999, border:'none', background:(!form.name.trim()||isPending)?'#d1bfb8':'#F26419', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, cursor:(!form.name.trim()||isPending)?'not-allowed':'pointer' }}>
            {isPending ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editId && (
            <button onClick={cancelEdit} style={{ padding:'10px 20px', borderRadius:999, border:'1.5px solid var(--border)', background:'transparent', color:'var(--text)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Resumen total */}
      {items.length > 0 && (
        <div style={{ background:'rgba(242,100,25,0.06)', border:'1px solid rgba(242,100,25,0.2)', borderRadius:'var(--radius)', padding:'14px 20px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--text-muted)' }}>
            {grouped.length} insumo{grouped.length !== 1 ? 's' : ''} · {items.length} compra{items.length !== 1 ? 's' : ''} registrada{items.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--orange)' }}>
            {fmt(totalSpent)} en insumos
          </span>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📦</div>
          <div style={{ fontSize:14, color:'var(--text-muted)' }}>No hay registros aún. Agrega el primero.</div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:14 }}>
            {([['insumos','📦 Por insumo'],['historial','🕐 Historial']] as const).map(([v,label]) => (
              <button key={v} onClick={() => { setView(v); if (v === 'insumos') setFilterName(null); }}
                style={{ padding:'7px 18px', borderRadius:999, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer', transition:'all .15s',
                  background:   view === v ? 'var(--orange)' : 'var(--card)',
                  color:        view === v ? '#fff' : 'var(--text-muted)',
                  border:       view === v ? '1px solid transparent' : '1px solid var(--border)' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Vista por insumo */}
          {view === 'insumos' && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {grouped.map(g => (
                <InsumoCard key={g.name} name={g.name} entries={g.entries}
                  onFilter={name => { setFilterName(name); setView('historial'); }}/>
              ))}
            </div>
          )}

          {/* Vista historial */}
          {view === 'historial' && (
            <>
              {filterName && (
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, background:'rgba(242,100,25,0.06)', border:'1px solid rgba(242,100,25,0.2)', borderRadius:8, padding:'8px 14px' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--orange)' }}>Filtrando: {filterName}</span>
                  <button onClick={() => setFilterName(null)} style={{ fontSize:12, color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', fontWeight:700 }}>✕ Ver todo</button>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {historialItems.map(c => (
                  <div key={c.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--text)' }}>{c.name}</div>
                        {c.notes && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{c.notes}</div>}
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                          {c.date} · Hace {daysAgo(c.date)} días
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => openEdit(c)} style={{ padding:'4px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Editar</button>
                        <button onClick={() => handleDelete(c)} style={{ padding:'4px 10px', borderRadius:8, border:'1px solid rgba(220,38,38,0.3)', background:'transparent', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>✕</button>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:12 }}>
                      {[
                        { label:'Cantidad',     value:`${c.quantity.toLocaleString('es-CL')} ${c.unit}` },
                        { label:'Total',        value:fmt(c.totalPrice) },
                        { label:`Por ${c.unit}`,value:fmt(c.unitPrice) },
                      ].map(s => (
                        <div key={s.label} style={{ background:'var(--bg2)', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:3 }}>{s.label}</div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--text)' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
