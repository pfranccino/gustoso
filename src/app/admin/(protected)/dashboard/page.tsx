'use client';

import { useLiveMetrics } from '@/hooks/useLiveMetrics';
import { DayBucket, RecentOrder } from '@/lib/firestore/metrics';

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function BarChart({ days }: { days: DayBucket[] }) {
  const max = Math.max(...days.map(d => d.total), 1);
  const W = 600, H = 100;
  const barW = Math.floor((W - days.length) / days.length);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: '100%', minWidth: 300, display: 'block' }}>
        {days.map((d, i) => {
          const bh = Math.max(2, Math.round((d.total / max) * H));
          const x = i * (barW + 1);
          return (
            <g key={d.date}>
              <rect x={x} y={H - bh} width={barW} height={bh} rx={3} fill="#F26419" opacity={d.total > 0 ? 1 : 0.15} />
              {i % 2 === 0 && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={9} fill="#A0541A">
                  {shortDate(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function OrdersTable({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>Aún no hay pedidos registrados.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
            {['Fecha', 'Items', 'Total', 'Desglose'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                {new Date(o.createdAt).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--orange)' }}>{o.itemCount}</td>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text)' }}>{fmt(o.total)}</td>
              <td style={{ padding: '8px 10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {o.items.map(it => `${it.qty}× ${it.name}`).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const { metrics, loading, error } = useLiveMetrics();

  const kpis = [
    { label: 'Total recaudado', value: metrics ? fmt(metrics.totalRevenue) : '—', emoji: '💰' },
    { label: 'N° pedidos',      value: metrics ? String(metrics.orderCount) : '—',  emoji: '📦' },
    { label: 'Ticket promedio', value: metrics ? fmt(metrics.avgTicket)    : '—', emoji: '📈' },
    { label: 'Producto top',    value: metrics ? metrics.topProduct        : '—', emoji: '🏆' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? 'Conectando…' : <><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}/> En vivo</>}
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 20 }}>
          Error conectando con Firestore. Revisa tu sesión.
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 16px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.emoji}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: 'var(--orange)', marginBottom: 4, wordBreak: 'break-word' }}>
              {loading ? <span style={{ opacity: 0.3 }}>—</span> : kpi.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {metrics && metrics.last14Days.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
            Recaudación — últimos 14 días
          </div>
          <BarChart days={metrics.last14Days} />
        </div>
      )}

      {/* Orders table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
          Últimos 10 pedidos
        </div>
        {loading
          ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando…</p>
          : <OrdersTable orders={metrics?.lastOrders ?? []} />
        }
      </div>
    </div>
  );
}
