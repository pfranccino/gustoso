'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { Order, OrderStatus } from '@/lib/firestore/orders';

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const STATUS_CFG = {
  pending:   { label: 'Pendiente',  color: '#d97706', bg: 'rgba(217,119,6,0.1)',   dot: '#f59e0b' },
  confirmed: { label: 'Confirmado', color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   dot: '#22c55e' },
  rejected:  { label: 'Rechazado',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   dot: '#ef4444' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, background:cfg.bg, fontSize:12, fontWeight:700, color:cfg.color }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
      {cfg.label}
    </span>
  );
}

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

export default function OrdersPage() {
  const [dayStartedAt, setDayStartedAt] = useState<Date | null>(null);
  const [dayClosedAt,  setDayClosedAt]  = useState<Date | null>(null);
  const [loadingDay,   setLoadingDay]   = useState(true);
  const [startingDay,  setStartingDay]  = useState(false);
  const [closingDay,   setClosingDay]   = useState(false);
  const [showAll,      setShowAll]      = useState(false);

  const isClosed = !!dayClosedAt && !!dayStartedAt && dayClosedAt > dayStartedAt;

  const activeFrom = showAll ? null : dayStartedAt;
  const { orders, loading } = useLiveOrders(activeFrom);

  // Cargar estado del día al montar
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
    } finally {
      setStartingDay(false);
    }
  };

  const handleCloseDay = async () => {
    if (pending.length > 0) {
      if (!confirm(`Hay ${pending.length} pedido${pending.length > 1 ? 's' : ''} pendiente${pending.length > 1 ? 's' : ''}. ¿Cerrar el día de todas formas?`)) return;
    }
    setClosingDay(true);
    try {
      const res = await fetch('/api/admin/start-day', { method: 'DELETE' });
      const { closedAt } = await res.json();
      setDayClosedAt(new Date(closedAt));
    } finally {
      setClosingDay(false);
    }
  };

  const handleStatus = useCallback(async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // El onSnapshot actualiza la lista automáticamente
  }, []);

  // KPIs
  const pending   = orders.filter(o => o.status === 'pending');
  const confirmed = orders.filter(o => o.status === 'confirmed');
  const rejected  = orders.filter(o => o.status === 'rejected');
  const revenue   = confirmed.reduce((s, o) => s + o.total, 0);

  const dayLabel = dayStartedAt
    ? dayStartedAt.toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginBottom:4 }}>
          Pedidos
        </h1>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {/* Estado del día */}
          {isClosed
            ? <span style={{ fontSize:13, fontWeight:700, color:'#16a34a', background:'rgba(22,163,74,0.1)', padding:'3px 10px', borderRadius:999 }}>🌙 Día cerrado</span>
            : dayLabel
              ? <span style={{ fontSize:13, color:'var(--text-muted)' }}>🌅 Desde {dayLabel}</span>
              : <span style={{ fontSize:13, color:'var(--text-muted)' }}>Sin día activo</span>
          }

          {/* Iniciar día — solo cuando no hay día activo */}
          {(!dayStartedAt || isClosed) && (
            <button onClick={handleStartDay} disabled={startingDay || loadingDay}
              style={{ padding:'6px 16px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: startingDay?'not-allowed':'pointer', opacity: startingDay?0.6:1 }}>
              {startingDay ? 'Iniciando…' : isClosed ? '🌅 Nuevo día' : '🌅 Iniciar día'}
            </button>
          )}

          {/* Cerrar día — solo cuando hay día activo */}
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
      </div>

      {/* KPIs */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'Pendientes',  value:pending.length,   color:'#d97706', bg:'rgba(217,119,6,0.08)'  },
            { label:'Confirmados', value:confirmed.length, color:'#16a34a', bg:'rgba(22,163,74,0.08)'  },
            { label:'Rechazados',  value:rejected.length,  color:'#dc2626', bg:'rgba(220,38,38,0.08)'  },
            { label:'Recaudado',   value:fmt(revenue),     color:'var(--orange)', bg:'rgba(242,100,25,0.08)' },
          ].map(k => (
            <div key={k.label} style={{ background:k.bg, border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:k.color }}>{k.value}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            </div>
          ))}
        </div>
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
      ) : (
        <div>
          {/* Pendientes primero */}
          {pending.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#d97706', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                🟡 Pendientes ({pending.length})
              </div>
              {pending.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
            </div>
          )}
          {confirmed.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#16a34a', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                🟢 Confirmados ({confirmed.length})
              </div>
              {confirmed.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
            </div>
          )}
          {rejected.length > 0 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#dc2626', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>
                🔴 Rechazados ({rejected.length})
              </div>
              {rejected.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
