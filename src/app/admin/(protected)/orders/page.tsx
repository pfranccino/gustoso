'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { Order, OrderStatus, PaymentMethod } from '@/lib/firestore/orders';

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const STATUS_CFG = {
  pending:   { label: 'Pendiente',  color: '#d97706', bg: 'rgba(217,119,6,0.1)',   dot: '#f59e0b' },
  confirmed: { label: 'Confirmado', color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   dot: '#22c55e' },
  rejected:  { label: 'Rechazado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   dot: '#ef4444' },
};

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

function filtersActive(f: Filters) {
  return f.status !== 'all' || f.payment !== 'all' || !!f.dateFrom || !!f.dateTo;
}

/* ── chips de filtro genéricos ─────────────────── */

function FilterChips<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const sel = value === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)}
              style={{ padding: '5px 12px', borderRadius: 999, border: '1.5px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
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
  const headers = ['Código', 'Fecha', 'Estado', 'Método de pago', 'Productos', 'Total', 'Ubicación'];
  const rows = orders.map(o => [
    o.orderId ?? '',
    new Date(o.createdAt).toLocaleString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    STATUS_CFG[o.status].label,
    o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod].replace(/^\S+\s/, '') : 'Sin especificar',
    o.items.map(it => `${it.qty}x ${it.name}${it.size ? ` (${it.size})` : ''}`).join(' | '),
    o.total,
    o.locationUrl ?? '',
  ]);
  const csv = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── StatusBadge ───────────────────────────────── */

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, background:cfg.bg, fontSize:12, fontWeight:700, color:cfg.color }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
      {cfg.label}
    </span>
  );
}

/* ── OrderCard ─────────────────────────────────── */

function OrderCard({ order, onStatus }: { order: Order; onStatus: (id: string, s: OrderStatus) => void }) {
  const [busy, setBusy] = useState(false);
  const change = async (s: OrderStatus) => {
    if (busy) return;
    setBusy(true);
    await onStatus(order.id, s);
    setBusy(false);
  };
  const time = new Date(order.createdAt).toLocaleString('es-CL', { hour:'2-digit', minute:'2-digit' });
  const date = new Date(order.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit' });

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:8, animation:'slideIn 0.3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:10 }}>
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
          </div>
          <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.7 }}>
            {order.items.map(it => `${it.qty}× ${it.name}${it.size ? ` (${it.size})` : ''}`).join(' · ')}
          </div>
        </div>
        <div style={{ flexShrink:0, textAlign:'right' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--orange)' }}>{fmt(order.total)}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{order.itemCount} ítem{order.itemCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
      {order.status === 'pending' && (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => change('confirmed')} disabled={busy}
            style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#16a34a', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: busy?'not-allowed':'pointer', opacity: busy?0.6:1 }}>
            ✓ Confirmar
          </button>
          <button onClick={() => change('rejected')} disabled={busy}
            style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(220,38,38,0.4)', background:'transparent', color:'#dc2626', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: busy?'not-allowed':'pointer', opacity: busy?0.6:1 }}>
            ✕ Rechazar
          </button>
        </div>
      )}
      {order.status !== 'pending' && (
        <button onClick={() => change('pending')} disabled={busy}
          style={{ fontSize:11, color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
          Restablecer a pendiente
        </button>
      )}
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

  const isClosed  = !!dayClosedAt && !!dayStartedAt && dayClosedAt > dayStartedAt;
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
      if (!confirm(`Hay ${pending.length} pedido${pending.length > 1 ? 's' : ''} pendiente${pending.length > 1 ? 's' : ''}. ¿Iniciar de todas formas?`)) return;
    }
    setStartingDay(true);
    try {
      const res = await fetch('/api/admin/start-day', { method: 'POST' });
      const { startedAt } = await res.json();
      setDayStartedAt(new Date(startedAt));
      setDayClosedAt(null);
      setShowAll(false);
    } finally { setStartingDay(false); }
  };

  const handleCloseDay = async () => {
    const pending = orders.filter(o => o.status === 'pending');
    if (pending.length > 0) {
      if (!confirm(`Hay ${pending.length} pedido${pending.length > 1 ? 's' : ''} pendiente${pending.length > 1 ? 's' : ''}. ¿Cerrar el día de todas formas?`)) return;
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }, []);

  /* ── aplicar todos los filtros ─────────────────── */
  const q = search.trim().toLowerCase();

  const filteredOrders = orders.filter(o => {
    if (filters.status !== 'all' && o.status !== filters.status) return false;
    if (filters.payment !== 'all') {
      if (filters.payment === 'none' && o.paymentMethod)                  return false;
      if (filters.payment !== 'none' && o.paymentMethod !== filters.payment) return false;
    }
    if (filters.dateFrom) {
      if (new Date(o.createdAt) < new Date(filters.dateFrom + 'T00:00:00')) return false;
    }
    if (filters.dateTo) {
      if (new Date(o.createdAt) > new Date(filters.dateTo + 'T23:59:59'))   return false;
    }
    if (q) {
      return (o.orderId ?? '').toLowerCase().includes(q) ||
             o.items.some(i => i.name.toLowerCase().includes(q));
    }
    return true;
  });

  /* ── KPIs sobre pedidos filtrados ──────────────── */
  const kpiPending   = filteredOrders.filter(o => o.status === 'pending');
  const kpiConfirmed = filteredOrders.filter(o => o.status === 'confirmed');
  const kpiRejected  = filteredOrders.filter(o => o.status === 'rejected');
  const kpiRevenue   = kpiConfirmed.reduce((s, o) => s + o.total, 0);

  /* ── resumen por método de pago (confirmados) ───── */
  const paymentBreakdown = (['efectivo', 'transferencia', 'debito'] as PaymentMethod[]).map(pm => ({
    method: pm,
    count:  kpiConfirmed.filter(o => o.paymentMethod === pm).length,
    total:  kpiConfirmed.filter(o => o.paymentMethod === pm).reduce((s, o) => s + o.total, 0),
  })).filter(p => p.count > 0);

  /* ── agrupación de la lista ────────────────────── */
  const showFlat = filters.status !== 'all';
  const listPending   = filteredOrders.filter(o => o.status === 'pending');
  const listConfirmed = filteredOrders.filter(o => o.status === 'confirmed');
  const listRejected  = filteredOrders.filter(o => o.status === 'rejected');

  const dayLabel = dayStartedAt
    ? dayStartedAt.toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : null;

  const active = filtersActive(filters);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:8 }}>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', margin:0 }}>Pedidos</h1>
          <button
            onClick={() => exportCSV(filteredOrders)}
            disabled={filteredOrders.length === 0}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:999, border:'1.5px solid #16a34a', background:'transparent', color:'#16a34a', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: filteredOrders.length === 0 ? 'not-allowed' : 'pointer', opacity: filteredOrders.length === 0 ? 0.4 : 1 }}>
            ⬇ Exportar Excel
            {filteredOrders.length > 0 && <span style={{ fontSize:11, opacity:.7 }}>({filteredOrders.length})</span>}
          </button>
        </div>

        {/* Controles del día */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          {isClosed
            ? <span style={{ fontSize:13, fontWeight:700, color:'#16a34a', background:'rgba(22,163,74,0.1)', padding:'3px 10px', borderRadius:999 }}>🌙 Día cerrado</span>
            : dayLabel
              ? <span style={{ fontSize:13, color:'var(--text-muted)' }}>🌅 Desde {dayLabel}</span>
              : <span style={{ fontSize:13, color:'var(--text-muted)' }}>Sin día activo</span>
          }
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

        {/* Buscador + botón filtros */}
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

        {/* Panel de filtros */}
        {showFilters && (
          <div style={{ marginTop:10, background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              <FilterChips<'all' | OrderStatus>
                label="Estado"
                options={[
                  { id:'all',       label:'Todos'      },
                  { id:'pending',   label:'⏳ Pendiente' },
                  { id:'confirmed', label:'✅ Confirmado' },
                  { id:'rejected',  label:'❌ Rechazado'  },
                ]}
                value={filters.status}
                onChange={v => setFilters(f => ({ ...f, status: v }))}
              />

              <FilterChips<'all' | PaymentMethod | 'none'>
                label="Método de pago"
                options={[
                  { id:'all',           label:'Todos'          },
                  { id:'efectivo',      label:'💵 Efectivo'     },
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
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif" }} />
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>hasta</span>
                  <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif" }} />
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

      {/* ── KPIs ── */}
      {!loading && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom: paymentBreakdown.length > 0 ? 10 : 20 }}>
            {[
              { label:'Pendientes',  value:kpiPending.length,   color:'#d97706', bg:'rgba(217,119,6,0.08)'  },
              { label:'Confirmados', value:kpiConfirmed.length, color:'#16a34a', bg:'rgba(22,163,74,0.08)'  },
              { label:'Rechazados',  value:kpiRejected.length,  color:'#dc2626', bg:'rgba(220,38,38,0.08)'  },
              { label:'Recaudado',   value:fmt(kpiRevenue),     color:'var(--orange)', bg:'rgba(242,100,25,0.08)' },
            ].map(k => (
              <div key={k.label} style={{ background:k.bg, border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Desglose por método de pago */}
          {paymentBreakdown.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
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

      {/* ── Lista ── */}
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
        /* Vista plana cuando hay filtro de estado */
        <div>
          {filteredOrders.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
        </div>
      ) : (
        /* Vista agrupada por estado (default) */
        <div>
          {listPending.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#d97706', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                🟡 Pendientes ({listPending.length})
              </div>
              {listPending.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
            </div>
          )}
          {listConfirmed.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#16a34a', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                🟢 Confirmados ({listConfirmed.length})
              </div>
              {listConfirmed.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
            </div>
          )}
          {listRejected.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#dc2626', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                🔴 Rechazados ({listRejected.length})
              </div>
              {listRejected.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
