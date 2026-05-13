'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveMetrics, PaymentBreakdown } from '@/hooks/useLiveMetrics';
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

function OrdersTable({ orders, newIds }: { orders: RecentOrder[]; newIds: Set<string> }) {
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
            <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', animation: newIds.has(o.id) ? 'slideIn 0.4s ease, flash 1.2s ease' : undefined }}>
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

function PaymentBreakdownPanel({ breakdown }: { breakdown: PaymentBreakdown[] }) {
  const fmt = (n: number) => n.toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 });
  const COLORS: Record<string, string> = { efectivo:'#16a34a', transferencia:'#2563eb', debito:'#7c3aed', none:'#9ca3af' };
  const grandTotal = breakdown.reduce((s, p) => s + p.total, 0);
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'18px 20px', boxShadow:'var(--shadow,none)', display:'flex', flexDirection:'column' }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:16 }}>Desglose de ingresos</div>
      {breakdown.length === 0
        ? <p style={{ fontSize:13, color:'var(--text-muted)' }}>Sin datos aún.</p>
        : breakdown.map(p => (
            <div key={p.method} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>{p.label}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color:'var(--text)' }}>{fmt(p.total)}</span>
              </div>
              <div style={{ height:6, background:'var(--bg2)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${p.pct}%`, height:'100%', background:COLORS[p.method] ?? 'var(--orange)', borderRadius:3, transition:'width .4s' }}/>
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{p.pct}% · {p.count} pedido{p.count !== 1 ? 's' : ''}</div>
            </div>
          ))
      }
      {grandTotal > 0 && (
        <div style={{ marginTop:'auto', paddingTop:10, borderTop:'1px dashed var(--border)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', letterSpacing:.8, textTransform:'uppercase' }}>TOTAL</span>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--orange)' }}>{fmt(grandTotal)}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { metrics, payment, loading, error } = useLiveMetrics();

  // Track which order IDs are new since last snapshot
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!metrics) return;
    const currentIds = metrics.lastOrders.map(o => o.id);
    const current = new Set(currentIds);
    const fresh   = new Set(currentIds.filter(id => !prevIdsRef.current.has(id)));
    if (prevIdsRef.current.size > 0 && fresh.size > 0) {
      setNewIds(fresh);
      setTimeout(() => setNewIds(new Set()), 1500);
    }
    prevIdsRef.current = current;
  }, [metrics]);

  // Track KPI changes for flash animation
  const prevTotal = useRef<number | null>(null);
  const [kpiFlash, setKpiFlash] = useState(false);
  useEffect(() => {
    if (metrics && prevTotal.current !== null && metrics.totalRevenue !== prevTotal.current) {
      setKpiFlash(true);
      setTimeout(() => setKpiFlash(false), 1200);
    }
    if (metrics) prevTotal.current = metrics.totalRevenue;
  }, [metrics?.totalRevenue]);

  const kpis = [
    { label: 'Total recaudado', value: metrics ? fmt(metrics.totalRevenue) : '—', sub: null,                                                            emoji: '💰' },
    { label: 'N° pedidos',      value: metrics ? String(metrics.orderCount) : '—', sub: null,                                                           emoji: '📦' },
    { label: 'Ticket promedio', value: metrics ? fmt(metrics.avgTicket)    : '—', sub: null,                                                            emoji: '📈' },
    { label: 'Producto top',    value: metrics?.topProduct?.name ?? '—',           sub: metrics?.topProduct ? `${metrics.topProduct.qty} vendidos` : null, emoji: '🏆' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 16px', animation: kpiFlash ? 'flash 1.2s ease' : undefined }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{kpi.emoji}</div>

            {kpi.label === 'Producto top' ? (
              /* Render especial: nombre como texto de producto, no como valor numérico */
              loading ? (
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: 'var(--orange)', marginBottom: 2, opacity: 0.3 }}>—</div>
              ) : metrics?.topProduct ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 2, lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {metrics.topProduct.name}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--orange)', marginBottom: 2 }}>
                    {metrics.topProduct.qty} vendidos
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Sin datos</div>
              )
            ) : (
              <>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: 'var(--orange)', marginBottom: 2, wordBreak: 'break-word', lineHeight: 1.1 }}>
                  {loading ? <span style={{ opacity: 0.3 }}>—</span> : kpi.value}
                </div>
                {kpi.sub && !loading && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{kpi.sub}</div>
                )}
              </>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart + payment breakdown side by side */}
      {metrics && metrics.last14Days.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, marginBottom:20, alignItems:'stretch' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
              Pedidos — últimos 14 días
            </div>
            <BarChart days={metrics.last14Days} />
          </div>
          <div style={{ minWidth:220, maxWidth:280 }}>
            <PaymentBreakdownPanel breakdown={payment}/>
          </div>
        </div>
      )}

      {/* Orders table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--text)', marginBottom: 16 }}>
          Últimos 10 pedidos
        </div>
        {loading
          ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando…</p>
          : <OrdersTable orders={metrics?.lastOrders ?? []} newIds={newIds} />
        }
      </div>
    </div>
  );
}
