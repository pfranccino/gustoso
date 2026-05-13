'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fmt } from '@/lib/menuData';

type OrderStatus =
  | 'pending' | 'confirmed' | 'on_the_way' | 'delivered'
  | 'rejected' | 'returned' | 'no_answer' | 'quote';

type OrderData = {
  orderId: string;
  status: OrderStatus;
  createdAt: string | null;
  total: number;
  deliveryFee: number | null;
  paymentMethod: string | null;
  itemCount: number;
  items: Array<{ name: string; qty: number; price: number; size?: string }>;
};

// Maps status → current active step index (0–4)
// Steps: 0=Recibido 1=Confirmando 2=En preparación 3=En camino 4=Entregado
// A value of 5 means all steps are done (delivered)
const STATUS_STEP: Record<OrderStatus, number> = {
  pending:    1,
  confirmed:  2,
  on_the_way: 3,
  delivered:  5,
  rejected:   -1,
  returned:   -1,
  no_answer:  -1,
  quote:      -1,
};

const TIMELINE_STEPS = [
  { label: 'Recibido',         inProgress: null },
  { label: 'Confirmando...',   inProgress: 'Esperando confirmación del local' },
  { label: 'En preparación',  inProgress: 'Preparando tu pedido' },
  { label: 'En camino',        inProgress: 'En camino a tu dirección' },
  { label: 'Entregado',        inProgress: null },
];

const NEGATIVE_STATUS: Record<string, { title: string; msg: string }> = {
  rejected:  { title: 'Pedido rechazado', msg: 'El local no pudo confirmar tu pedido. Contáctalos por WhatsApp para más info.' },
  returned:  { title: 'Pedido devuelto',  msg: 'Tu pedido fue marcado como devuelto. Contáctalos por WhatsApp para más info.' },
  no_answer: { title: 'Sin respuesta',    msg: 'No pudimos comunicarnos contigo. Contáctalos por WhatsApp para coordinar.' },
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function PedidoPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder]     = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [waNumber, setWaNumber] = useState('');

  // Persist orderId in localStorage for returning visits
  useEffect(() => {
    try {
      localStorage.setItem('gustoso_last_order', orderId);
      setWaNumber(localStorage.getItem('gustoso_wa') ?? '');
    } catch {}
  }, [orderId]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedido/${orderId}`);
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      if (!res.ok) return;
      const data: OrderData = await res.json();
      setOrder(data);
      setLoading(false);
    } catch {}
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola, quiero consultar por mi pedido ${orderId}`)}`
    : null;

  /* ── Shared shell ─────────────────────────── */
  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', padding:'48px 20px 40px', fontFamily:"'Barlow',sans-serif" }}>
      <div style={{ width:'100%', maxWidth:440 }}>

        {/* Back to menu */}
        <button
          onClick={() => router.push('/')}
          style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer', padding:0, marginBottom:32 }}
        >
          ← Volver al menú
        </button>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:'center', paddingTop:60 }}>
            <div style={{ fontSize:36, marginBottom:16 }}>⏳</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:20, color:'var(--text)' }}>Buscando tu pedido…</div>
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div style={{ textAlign:'center', paddingTop:60 }}>
            <div style={{ fontSize:36, marginBottom:16 }}>🔍</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, color:'var(--text)', marginBottom:8 }}>Pedido no encontrado</div>
            <div style={{ color:'var(--text-muted)', fontSize:14 }}>El código <strong>{orderId}</strong> no existe. Verifica el link o contácta al local.</div>
          </div>
        )}

        {/* Order found */}
        {!loading && order && (() => {
          const currentStep = STATUS_STEP[order.status] ?? 0;
          const isNegative  = currentStep === -1;
          const negative    = NEGATIVE_STATUS[order.status];

          return (
            <>
              {/* Header */}
              <div style={{ textAlign:'center', marginBottom:32 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>
                  {isNegative ? '⚠️' : order.status === 'delivered' ? '✅' : '✓'}
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color: isNegative ? '#dc2626' : 'var(--text)', lineHeight:1.1, marginBottom:6 }}>
                  {isNegative ? negative?.title : order.status === 'delivered' ? '¡Entregado!' : '¡Pedido recibido!'}
                </div>
                <div style={{ display:'inline-block', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:999, padding:'4px 14px', fontSize:14, fontWeight:700, color:'var(--orange)', letterSpacing:.5 }}>
                  #{order.orderId}
                </div>
                {order.createdAt && (
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>
                    Recibido a las {formatTime(order.createdAt)}
                  </div>
                )}
              </div>

              {/* Negative state message */}
              {isNegative && (
                <div style={{ background:'rgba(220,38,38,0.07)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:24, color:'#dc2626', fontSize:14, fontWeight:500, lineHeight:1.6 }}>
                  {negative?.msg}
                </div>
              )}

              {/* Timeline */}
              {!isNegative && (
                <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px 24px', marginBottom:24 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:16 }}>Estado del pedido</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {TIMELINE_STEPS.map((step, i) => {
                      const isDone       = i < currentStep;
                      const isActive     = i === currentStep - 1 && currentStep < 5;
                      const isFuture     = i >= currentStep && !isActive;
                      const isAllDone    = currentStep === 5;

                      const dotColor = (isDone || isAllDone)
                        ? '#16a34a'
                        : isActive
                          ? 'var(--orange)'
                          : 'var(--border)';

                      const textColor = (isDone || isAllDone || isActive)
                        ? 'var(--text)'
                        : 'var(--text-muted)';

                      return (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14, paddingBottom: i < TIMELINE_STEPS.length - 1 ? 16 : 0, position:'relative' }}>
                          {/* Line connector */}
                          {i < TIMELINE_STEPS.length - 1 && (
                            <div style={{
                              position:'absolute', left:8, top:18, width:2, height:'calc(100% - 8px)',
                              background: isDone || isAllDone ? '#16a34a' : 'var(--border)',
                              opacity: isDone || isAllDone ? 0.5 : 0.3,
                            }}/>
                          )}
                          {/* Dot */}
                          <div style={{ width:18, height:18, borderRadius:'50%', border:`2.5px solid ${dotColor}`, background: (isDone || isAllDone) ? '#16a34a' : isActive ? 'transparent' : 'transparent', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                            {(isDone || isAllDone) && (
                              <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>
                            )}
                            {isActive && (
                              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--orange)', animation:'pulse 1.5s ease-in-out infinite' }}/>
                            )}
                          </div>
                          {/* Label */}
                          <div>
                            <div style={{ fontSize:14, fontWeight: isActive ? 700 : 600, color: textColor, lineHeight:1.3 }}>
                              {isActive && step.inProgress ? step.inProgress : step.label}
                            </div>
                            {isActive && (
                              <div style={{ fontSize:12, color:'var(--orange)', fontWeight:600, marginTop:1 }}>en proceso</div>
                            )}
                            {isDone && i === 0 && order.createdAt && (
                              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{formatTime(order.createdAt)}</div>
                            )}
                            {(isAllDone && i === TIMELINE_STEPS.length - 1) && (
                              <div style={{ fontSize:12, color:'#16a34a', fontWeight:600, marginTop:1 }}>completado</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order summary */}
              <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:24 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Resumen</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: order.deliveryFee ? 6 : 0 }}>
                  <span style={{ fontSize:14, color:'var(--text-muted)' }}>
                    {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}
                  </span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text)' }}>{fmt(order.total - (order.deliveryFee ?? 0))}</span>
                </div>
                {order.deliveryFee != null && order.deliveryFee > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:14, color:'var(--text-muted)' }}>Delivery</span>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text)' }}>{fmt(order.deliveryFee)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:'var(--text-muted)', letterSpacing:.5 }}>TOTAL</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--text)' }}>{fmt(order.total)}</span>
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#25D366', color:'#fff', padding:'14px 24px', borderRadius:999, textDecoration:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, letterSpacing:.5, boxShadow:'0 4px 16px rgba(37,211,102,0.25)' }}>
                    Abrir WhatsApp
                  </a>
                )}
                <button
                  onClick={() => router.push('/')}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', padding:'13px 24px', borderRadius:999, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', letterSpacing:.3 }}
                >
                  Volver al menú
                </button>
              </div>
            </>
          );
        })()}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}
