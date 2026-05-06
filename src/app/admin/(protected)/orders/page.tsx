'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { Order, OrderStatus, OrderNote, PaymentMethod } from '@/lib/firestore/orders';

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/* ── configuración de estados ──────────────────── */

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; dot: string; emoji: string }> = {
  pending:   { label: 'Pendiente',    color: '#d97706', bg: 'rgba(217,119,6,0.1)',   dot: '#f59e0b', emoji: '⏳' },
  confirmed: { label: 'Confirmado',   color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   dot: '#22c55e', emoji: '✅' },
  delivered: { label: 'Entregado',    color: '#2563eb', bg: 'rgba(37,99,235,0.1)',   dot: '#3b82f6', emoji: '📦' },
  rejected:  { label: 'Rechazado',    color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   dot: '#ef4444', emoji: '❌' },
  returned:  { label: 'Devuelto',     color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  dot: '#8b5cf6', emoji: '🔄' },
  no_answer: { label: 'No contestó',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)', dot: '#9ca3af', emoji: '📵' },
  quote:     { label: 'Cotización',   color: '#0891b2', bg: 'rgba(8,145,178,0.1)',   dot: '#06b6d4', emoji: '📋' },
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as OrderStatus[];

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo:      '💵 Efectivo',
  transferencia: '🏦 Transferencia',
  debito:        '💳 Débito/Crédito',
};

/* ── tipos de filtros ──────────────────────────── */

type Filters = {
  status:  'all' | OrderStatus;
  payment: 'all' | PaymentMethod | 'none';
  dateFrom: string;
  dateTo:   string;
};
const EMPTY_FILTERS: Filters = { status: 'all', payment: 'all', dateFrom: '', dateTo: '' };
const filtersActive = (f: Filters) =>
  f.status !== 'all' || f.payment !== 'all' || !!f.dateFrom || !!f.dateTo;

/* ── FilterChips genérico ──────────────────────── */

function FilterChips<T extends string>({ label, options, value, onChange }: {
  label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {options.map(opt => {
          const sel = value === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)}
              style={{ padding:'5px 12px', borderRadius:999, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s',
                borderColor: sel ? 'var(--orange)' : 'var(--border)',
                background:  sel ? 'rgba(242,100,25,0.1)' : 'transparent',
                color:       sel ? 'var(--orange)' : 'var(--text-muted)' }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── exportar CSV ──────────────────────────────── */

function exportCSV(orders: Order[]) {
  const BOM = '﻿';
  const headers = ['Código', 'Fecha', 'Estado', 'Método de pago', 'Productos', 'Total', 'Descuento', 'Notas', 'Ubicación'];
  const rows = orders.map(o => [
    o.orderId ?? '',
    new Date(o.createdAt).toLocaleString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    STATUS_CFG[o.status].label,
    o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod].replace(/^\S+\s/, '') : 'Sin especificar',
    o.items.map(it => `${it.qty}x ${it.name}${it.size ? ` (${it.size})` : ''}`).join(' | '),
    o.total,
    o.discountCode ? `${o.discountCode} (-${o.discountAmount ?? 0})` : '',
    (o.notes ?? []).map(n => n.text).join(' / '),
    o.locationUrl ?? '',
  ]);
  const csv = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ── StatusBadge ───────────────────────────────── */

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, background:cfg.bg, fontSize:12, fontWeight:700, color:cfg.color }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, flexShrink:0 }}/>
      {cfg.label}
    </span>
  );
}

/* ── NotesSection ──────────────────────────────── */

function NotesSection({ order, onAddNote }: {
  order: Order;
  onAddNote: (id: string, text: string) => Promise<void>;
}) {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const notes = order.notes ?? [];

  async function submit() {
    const t = text.trim();
    if (!t || saving) return;
    setSaving(true);
    await onAddNote(order.id, t);
    setText('');
    setSaving(false);
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return 'ahora';
    if (m < 60)  return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `hace ${h}h`;
    return new Date(iso).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit' });
  }

  return (
    <div style={{ marginTop:10 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ fontSize:12, color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5 }}>
        💬 {notes.length > 0 ? `${notes.length} nota${notes.length > 1 ? 's' : ''}` : 'Agregar nota'}
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop:8 }}>
          {notes.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
              {notes.map((n, i) => (
                <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px' }}>
                  <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{n.text}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{relativeTime(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
              placeholder="Escribe una nota interna…"
              style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none' }}
            />
            <button onClick={submit} disabled={saving || !text.trim()}
              style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: (saving || !text.trim()) ? 'not-allowed' : 'pointer', opacity: (saving || !text.trim()) ? 0.5 : 1 }}>
              {saving ? '…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── StatusSelector ────────────────────────────── */

function StatusSelector({ current, onStatus, busy }: {
  current: OrderStatus;
  onStatus: (s: OrderStatus) => void;
  busy: boolean;
}) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
      {ALL_STATUSES.filter(s => s !== current).map(s => {
        const cfg = STATUS_CFG[s];
        return (
          <button key={s} onClick={() => onStatus(s)} disabled={busy}
            style={{ padding:'5px 11px', borderRadius:999, border:`1.5px solid ${cfg.color}22`, background:'transparent', color:cfg.color, fontSize:12, fontWeight:700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1, transition:'background .15s' }}>
            {cfg.emoji} {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── OrderCard ─────────────────────────────────── */

function OrderCard({ order, onStatus, onAddNote }: {
  order: Order;
  onStatus: (id: string, s: OrderStatus) => Promise<void>;
  onAddNote: (id: string, text: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const change = async (s: OrderStatus) => {
    if (busy) return;
    setBusy(true);
    await onStatus(order.id, s);
    setBusy(false);
  };

  const time = new Date(order.createdAt).toLocaleString('es-CL', { hour:'2-digit', minute:'2-digit' });
  const date = new Date(order.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit' });
  const notes = order.notes ?? [];

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:8, animation:'slideIn 0.3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            {order.orderId && (
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, color:'var(--orange)', background:'rgba(242,100,25,0.1)', padding:'2px 8px', borderRadius:6, letterSpacing:1 }}>
                {order.orderId}
              </span>
            )}
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>{date} · {time}</span>
            <StatusBadge status={order.status}/>
            {order.paymentMethod && (
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', background:'var(--bg2)', padding:'2px 7px', borderRadius:6, border:'1px solid var(--border)' }}>
                {PAYMENT_LABEL[order.paymentMethod]}
              </span>
            )}
            {order.locationUrl && (
              <a href={order.locationUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize:11, color:'var(--orange)', textDecoration:'none', fontWeight:600 }}>📍 Ubicación</a>
            )}
            {notes.length > 0 && (
              <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>💬 {notes.length}</span>
            )}
          </div>
          <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7 }}>
            {order.items.map(it => `${it.qty}× ${it.name}${it.size ? ` (${it.size})` : ''}`).join(' · ')}
          </div>
          {order.discountCode && (
            <div style={{ fontSize:12, color:'#16a34a', marginTop:2, fontWeight:600 }}>
              🏷 {order.discountCode} -{fmt(order.discountAmount ?? 0)}
            </div>
          )}
        </div>
        <div style={{ flexShrink:0, textAlign:'right' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--orange)' }}>{fmt(order.total)}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.itemCount} ítem{order.itemCount !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Selector de estado */}
      <StatusSelector current={order.status} onStatus={change} busy={busy} />

      {/* Notas */}
      <NotesSection order={order} onAddNote={onAddNote} />
    </div>
  );
}

/* ── OrdersPage ────────────────────────────────── */

export default function OrdersPage() {
  const [dayStartedAt, setDayStartedAt] = useState<Date | null>(null);
  const [dayClosedAt,  setDayClosedAt]  = useState<Date | null>(null);
  const [loadingDay,   setLoadingDay]   = useState(true);
  const [startingDay,  setStartingDay]  = useState(false);
  const [closingDay,   setClosingDay]   = useState(false);
  const [showAll,      setShowAll]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [filters,      setFilters]      = useState<Filters>(EMPTY_FILTERS);
  const [showFilters,  setShowFilters]  = useState(false);

  const isClosed   = !!dayClosedAt && !!dayStartedAt && dayClosedAt > dayStartedAt;
  const activeFrom = showAll ? null : dayStartedAt;
  const { orders, loading } = useLiveOrders(activeFrom);

  useEffect(() => {
    fetch('/api/admin/start-day')
      .then(r => r.json())
      .then(({ startedAt, closedAt }) => {
        setDayStartedAt(startedAt ? new Date(startedAt) : null);
        setDayClosedAt(closedAt  ? new Date(closedAt)  : null);
        setLoadingDay(false);
      })
      .catch(() => setLoadingDay(false));
  }, []);

  const handleStartDay = async () => {
    const pending = orders.filter(o => o.status === 'pending');
    if (pending.length > 0 && dayStartedAt && !isClosed) {
      if (!confirm(`Hay ${pending.length} pedido(s) pendiente(s). ¿Iniciar de todas formas?`)) return;
    }
    setStartingDay(true);
    try {
      const res = await fetch('/api/admin/start-day', { method: 'POST' });
      const { startedAt } = await res.json();
      setDayStartedAt(new Date(startedAt)); setDayClosedAt(null); setShowAll(false);
    } finally { setStartingDay(false); }
  };

  const handleCloseDay = async () => {
    const pending = orders.filter(o => o.status === 'pending');
    if (pending.length > 0) {
      if (!confirm(`Hay ${pending.length} pedido(s) pendiente(s). ¿Cerrar el día de todas formas?`)) return;
    }
    setClosingDay(true);
    try {
      const res = await fetch('/api/admin/start-day', { method: 'DELETE' });
      const { closedAt } = await res.json();
      setDayClosedAt(new Date(closedAt));
    } finally { setClosingDay(false); }
  };

  const handleStatus = useCallback(async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }, []);

  const handleAddNote = useCallback(async (id: string, note: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
  }, []);

  /* ── filtros ── */
  const q = search.trim().toLowerCase();
  const filteredOrders = orders.filter(o => {
    if (filters.status !== 'all' && o.status !== filters.status) return false;
    if (filters.payment !== 'all') {
      if (filters.payment === 'none' && o.paymentMethod)                     return false;
      if (filters.payment !== 'none' && o.paymentMethod !== filters.payment) return false;
    }
    if (filters.dateFrom && new Date(o.createdAt) < new Date(filters.dateFrom + 'T00:00:00')) return false;
    if (filters.dateTo   && new Date(o.createdAt) > new Date(filters.dateTo   + 'T23:59:59')) return false;
    if (q) return (o.orderId ?? '').toLowerCase().includes(q) || o.items.some(i => i.name.toLowerCase().includes(q));
    return true;
  });

  /* ── KPIs ── */
  const kpiByStatus = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = filteredOrders.filter(o => o.status === s).length;
    return acc;
  }, {});
  const kpiRevenue   = filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  /* ── desglose pago ── */
  const paymentBreakdown = (['efectivo', 'transferencia', 'debito'] as PaymentMethod[]).map(pm => ({
    method: pm,
    count:  filteredOrders.filter(o => o.paymentMethod === pm && (o.status === 'confirmed' || o.status === 'delivered')).length,
    total:  filteredOrders.filter(o => o.paymentMethod === pm && (o.status === 'confirmed' || o.status === 'delivered')).reduce((s, o) => s + o.total, 0),
  })).filter(p => p.count > 0);

  /* ── agrupación de lista ── */
  const showFlat = filters.status !== 'all';
  const grouped = ALL_STATUSES.reduce<Record<string, Order[]>>((acc, s) => {
    const list = filteredOrders.filter(o => o.status === s);
    if (list.length) acc[s] = list;
    return acc;
  }, {});

  const active   = filtersActive(filters);
  const dayLabel = dayStartedAt
    ? dayStartedAt.toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:8 }}>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', margin:0 }}>Pedidos</h1>
          <button onClick={() => exportCSV(filteredOrders)} disabled={filteredOrders.length === 0}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:999, border:'1.5px solid #16a34a', background:'transparent', color:'#16a34a', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: filteredOrders.length === 0 ? 'not-allowed' : 'pointer', opacity: filteredOrders.length === 0 ? 0.4 : 1 }}>
            ⬇ Exportar Excel {filteredOrders.length > 0 && <span style={{ fontSize:11, opacity:.7 }}>({filteredOrders.length})</span>}
          </button>
        </div>

        {/* Controles del día */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          {isClosed
            ? <span style={{ fontSize:13, fontWeight:700, color:'#16a34a', background:'rgba(22,163,74,0.1)', padding:'3px 10px', borderRadius:999 }}>🌙 Día cerrado</span>
            : dayLabel ? <span style={{ fontSize:13, color:'var(--text-muted)' }}>🌅 Desde {dayLabel}</span>
            : <span style={{ fontSize:13, color:'var(--text-muted)' }}>Sin día activo</span>}
          {(!dayStartedAt || isClosed) && (
            <button onClick={handleStartDay} disabled={startingDay || loadingDay}
              style={{ padding:'6px 16px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: startingDay?'not-allowed':'pointer', opacity: startingDay?0.6:1 }}>
              {startingDay ? 'Iniciando…' : isClosed ? '🌅 Nuevo día' : '🌅 Iniciar día'}
            </button>
          )}
          {dayStartedAt && !isClosed && (
            <button onClick={handleCloseDay} disabled={closingDay}
              style={{ padding:'6px 16px', borderRadius:999, border:'1.5px solid #16a34a', background:'transparent', color:'#16a34a', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: closingDay?'not-allowed':'pointer', opacity: closingDay?0.6:1 }}>
              {closingDay ? 'Cerrando…' : '🌙 Cerrar día'}
            </button>
          )}
          <button onClick={() => setShowAll(v => !v)}
            style={{ padding:'6px 14px', borderRadius:999, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {showAll ? 'Ver día actual' : 'Ver histórico'}
          </button>
        </div>

        {/* Buscador + filtros */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ position:'relative', flex:1 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text-muted)', pointerEvents:'none' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código o producto…"
              style={{ width:'100%', padding:'9px 36px 9px 34px', borderRadius:999, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted)', lineHeight:1 }}>×</button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            style={{ flexShrink:0, padding:'9px 16px', borderRadius:999, border:`1.5px solid ${active ? 'var(--orange)' : 'var(--border)'}`, background: active ? 'rgba(242,100,25,0.08)' : 'transparent', color: active ? 'var(--orange)' : 'var(--text-muted)', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            ⚙ Filtros{active ? ' •' : ''}
          </button>
        </div>

        {/* Panel filtros */}
        {showFilters && (
          <div style={{ marginTop:10, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <FilterChips<'all' | OrderStatus>
                label="Estado"
                options={[
                  { id:'all', label:'Todos' },
                  ...ALL_STATUSES.map(s => ({ id: s, label: `${STATUS_CFG[s].emoji} ${STATUS_CFG[s].label}` })),
                ]}
                value={filters.status}
                onChange={v => setFilters(f => ({ ...f, status: v }))}
              />
              <FilterChips<'all' | PaymentMethod | 'none'>
                label="Método de pago"
                options={[
                  { id:'all',           label:'Todos' },
                  { id:'efectivo',      label:'💵 Efectivo' },
                  { id:'transferencia', label:'🏦 Transferencia' },
                  { id:'debito',        label:'💳 Débito/Crédito' },
                  { id:'none',          label:'Sin especificar' },
                ]}
                value={filters.payment}
                onChange={v => setFilters(f => ({ ...f, payment: v }))}
              />
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Rango de fechas</div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13 }} />
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>hasta</span>
                  <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13 }} />
                </div>
              </div>
            </div>
            {active && (
              <button onClick={() => setFilters(EMPTY_FILTERS)}
                style={{ marginTop:14, fontSize:12, fontWeight:700, color:'#dc2626', background:'transparent', border:'none', cursor:'pointer', padding:0 }}>
                × Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      {!loading && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom: paymentBreakdown.length > 0 ? 8 : 16 }}>
            {/* Recaudado (confirmados + entregados) */}
            <div style={{ gridColumn:'span 2', background:'rgba(242,100,25,0.08)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>Recaudado (confirmados + entregados)</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--orange)' }}>{fmt(kpiRevenue)}</div>
            </div>
            {/* Contadores por estado */}
            {ALL_STATUSES.filter(s => kpiByStatus[s] > 0).map(s => {
              const cfg = STATUS_CFG[s];
              return (
                <div key={s} style={{ background:cfg.bg, border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 14px' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:cfg.color }}>{kpiByStatus[s]}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>{cfg.emoji} {cfg.label}</div>
                </div>
              );
            })}
          </div>

          {paymentBreakdown.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {paymentBreakdown.map(p => (
                <div key={p.method} style={{ flex:1, minWidth:120, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 14px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:3 }}>{PAYMENT_LABEL[p.method]}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--orange)' }}>{fmt(p.total)}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.count} pedido{p.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ fontSize:14, color:'var(--text-muted)', padding:'32px 0', textAlign:'center' }}>Conectando…</div>
      ) : orders.length === 0 ? (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
          <div style={{ fontSize:14, color:'var(--text-muted)' }}>
            {showAll ? 'No hay pedidos registrados.' : dayStartedAt ? 'No hay pedidos desde que se inició el día.' : 'Inicia el día para ver los pedidos de esta jornada.'}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:14, color:'var(--text-muted)' }}>Sin resultados para los filtros aplicados.</div>
          <button onClick={() => { setFilters(EMPTY_FILTERS); setSearch(''); }}
            style={{ marginTop:10, fontSize:13, fontWeight:700, color:'var(--orange)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline' }}>
            Limpiar filtros
          </button>
        </div>
      ) : showFlat ? (
        filteredOrders.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} onAddNote={handleAddNote}/>)
      ) : (
        Object.entries(grouped).map(([s, list]) => {
          const cfg = STATUS_CFG[s as OrderStatus];
          return (
            <div key={s} style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:cfg.color, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                {cfg.emoji} {cfg.label} ({list.length})
              </div>
              {list.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} onAddNote={handleAddNote}/>)}
            </div>
          );
        })
      )}
    </div>
  );
}
