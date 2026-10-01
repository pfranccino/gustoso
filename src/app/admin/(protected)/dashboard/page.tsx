'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveMetrics, PaymentBreakdown } from '@/hooks/useLiveMetrics';
import { DayBucket, RecentOrder } from '@/lib/firestore/metrics';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminCard from '@/components/admin/AdminCard';
import AdminButton from '@/components/admin/AdminButton';
import StatusBadge from '@/components/admin/StatusBadge';
import { DollarSign, Package, TrendingUp, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function MiniBarChart({ days }: { days: DayBucket[] }) {
  const max = Math.max(...days.map(d => d.total), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:80, width:'100%' }}>
      {days.map((d, i) => {
        const pct = Math.max(2, Math.round((d.total / max) * 100));
        return (
          <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }} title={`${shortDate(d.date)}: ${d.total > 0 ? `$${d.total.toLocaleString('es-CL')}` : 'sin pedidos'}`}>
            <div style={{ width:'100%', background:'var(--brand)', borderRadius:'3px 3px 0 0', height:`${pct}%`, opacity: d.total > 0 ? 1 : 0.15, transition:'height .3s' }}/>
            {i % 2 === 0 && (
              <div style={{ fontSize:8, color:'var(--ink-500)', whiteSpace:'nowrap', textAlign:'center', lineHeight:1, marginTop:2 }}>
                {shortDate(d.date)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ORDER_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',  color: 'var(--st-pending)' },
  confirmed:  { label: 'Confirmado', color: 'var(--st-confirmed)' },
  on_the_way: { label: 'En camino',  color: 'var(--st-transit)' },
  delivered:  { label: 'Entregado',  color: 'var(--st-delivered)' },
  rejected:   { label: 'Rechazado',  color: 'var(--st-rejected)' },
};

function OrdersTable({ orders, newIds }: { orders: RecentOrder[]; newIds: Set<string> }) {
  if (orders.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--ink-500)', padding: '16px 0' }}>Aún no hay pedidos registrados.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--line)' }}>
            {['Hora', 'Estado', 'Productos', 'Pago', 'Total'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10, fontWeight: 800, color: 'var(--ink-500)', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => {
            const sCfg = ORDER_STATUS_CFG[(o as unknown as { status?: string }).status ?? ''];
            return (
              <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--line)' : 'none', animation: newIds.has(o.id) ? 'slideIn 0.4s ease, flash 1.2s ease' : undefined }}>
                <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', color: 'var(--ink-500)', fontWeight: 600 }}>
                  {new Date(o.createdAt).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  {sCfg ? (
                    <StatusBadge color={sCfg.color} label={sCfg.label}/>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '11px 14px', color: 'var(--ink-900)', lineHeight: 1.5 }}>
                  {o.items.map(it => `${it.qty}× ${it.name}`).join(' · ')}
                </td>
                <td style={{ padding: '11px 14px', color: 'var(--ink-500)', fontSize: 12, fontWeight: 600 }}>
                  {(o as unknown as { paymentMethod?: string }).paymentMethod ?? '—'}
                </td>
                <td style={{ padding: '11px 14px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, color: 'var(--ink-900)' }}>
                  {fmt(o.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PaymentBreakdownPanel({ breakdown }: { breakdown: PaymentBreakdown[] }) {
  const fmt = (n: number) => n.toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 });
  const COLORS: Record<string, string> = { efectivo:'var(--st-confirmed)', transferencia:'var(--st-delivered)', debito:'var(--st-returned)', none:'var(--st-neutral)' };
  const grandTotal = breakdown.reduce((s, p) => s + p.total, 0);
  return (
    <div style={{ background:'var(--surface-raised)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'18px 20px', boxShadow:'var(--shadow,none)', display:'flex', flexDirection:'column' }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--ink-900)', marginBottom:16 }}>Desglose de ingresos</div>
      {breakdown.length === 0
        ? <p style={{ fontSize:13, color:'var(--ink-500)' }}>Sin datos aún.</p>
        : breakdown.map(p => (
            <div key={p.method} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--ink-500)' }}>{p.label}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color:'var(--ink-900)' }}>{fmt(p.total)}</span>
              </div>
              <div style={{ height:6, background:'var(--surface-sunken)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${p.pct}%`, height:'100%', background:COLORS[p.method] ?? 'var(--brand)', borderRadius:3, transition:'width .4s' }}/>
              </div>
              <div style={{ fontSize:11, color:'var(--ink-500)', marginTop:2 }}>{p.pct}% · {p.count} pedido{p.count !== 1 ? 's' : ''}</div>
            </div>
          ))
      }
      {grandTotal > 0 && (
        <div style={{ marginTop:'auto', paddingTop:10, borderTop:'1px dashed var(--line)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <span style={{ fontSize:11, fontWeight:800, color:'var(--ink-500)', letterSpacing:.8, textTransform:'uppercase' }}>TOTAL</span>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--brand)' }}>{fmt(grandTotal)}</span>
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

  const kpis: { label: string; value: string; sub: string | null; icon: LucideIcon }[] = [
    { label: 'Total recaudado', value: metrics ? fmt(metrics.totalRevenue) : '—', sub: null,                                                            icon: DollarSign },
    { label: 'N° pedidos',      value: metrics ? String(metrics.orderCount) : '—', sub: null,                                                           icon: Package },
    { label: 'Ticket promedio', value: metrics ? fmt(metrics.avgTicket)    : '—', sub: null,                                                            icon: TrendingUp },
    { label: 'Producto top',    value: metrics?.topProduct?.name ?? '—',           sub: metrics?.topProduct ? `${metrics.topProduct.qty} vendidos` : null, icon: Trophy },
  ];

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle={loading ? 'Conectando…' : 'En vivo'}
        isLive={!loading && !error}
      />

      {error && (
        <div style={{ background: 'var(--st-rejected-soft)', border: '1px solid var(--st-rejected)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--st-rejected)', fontWeight: 600, marginBottom: 20 }}>
          Error conectando con Firestore. Revisa tu sesión.
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-card)', animation: kpiFlash ? 'flash 1.2s ease' : undefined, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--ink-500)', letterSpacing: 1.4, textTransform: 'uppercase' }}>{kpi.label}</span>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><kpi.icon size={16} style={{color:'var(--brand)'}}/></span>
            </div>

            {kpi.label === 'Producto top' ? (
              loading ? (
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: 'var(--brand)', opacity: 0.3, lineHeight: 1 }}>—</div>
              ) : metrics?.topProduct ? (
                <>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--ink-900)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                    {metrics.topProduct.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600, marginTop: 6 }}>
                    {metrics.topProduct.qty} vendidos
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-500)' }}>Sin datos</div>
              )
            ) : (
              <>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--ink-900)', lineHeight: 1, letterSpacing: -0.5 }}>
                  {loading ? <span style={{ opacity: 0.3 }}>—</span> : kpi.value}
                </div>
                {kpi.sub && !loading && (
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600, marginTop: 6 }}>{kpi.sub}</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Bar chart + payment breakdown side by side */}
      {metrics && metrics.last14Days.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, marginBottom: 20, alignItems: 'stretch' }}>
          <AdminCard title="Pedidos por día" subtitle="Últimos 14 días">
            <MiniBarChart days={metrics.last14Days} />
          </AdminCard>
          <PaymentBreakdownPanel breakdown={payment}/>
        </div>
      )}

      {/* Orders table */}
      <AdminCard title="Últimos pedidos" actions={
        <AdminButton variant="ghost" size="sm" onClick={() => window.location.href = '/admin/orders'}>
          Ver todos →
        </AdminButton>
      } padding="0">
        {loading
          ? <p style={{ fontSize: 13, color: 'var(--ink-500)', padding: '16px 20px' }}>Cargando…</p>
          : <OrdersTable orders={metrics?.lastOrders ?? []} newIds={newIds} />
        }
      </AdminCard>
    </div>
  );
}
