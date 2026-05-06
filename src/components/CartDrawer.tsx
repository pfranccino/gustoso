'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { fmt } from '@/lib/menuData';
import { useSettings } from '@/contexts/SettingsContext';
import { TrashIcon, WAIcon } from './icons';
import { useGeolocation } from '@/hooks/useGeolocation';
import { PaymentMethod } from '@/lib/firestore/orders';
import { DeliveryConfig } from '@/lib/firestore/settingsTypes';

function getSessionId(): string {
  const key = 'gustosos_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GST-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

type AppliedDiscount = { code: string; type: 'fixed' | 'percent'; value: number; display: string; amount: number };

/* ── Haversine distance (km) ─────────────────── */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcDeliveryFee(distKm: number, cfg: DeliveryConfig): number | null {
  const sorted = [...cfg.zones].sort((a, b) => a.maxKm - b.maxKm);
  const zone = sorted.find(z => distKm <= z.maxKm);
  if (zone) return zone.price;
  if (cfg.extraPricePerKm > 0 && sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    const extra = Math.ceil(distKm - last.maxKm);
    return last.price + extra * cfg.extraPricePerKm;
  }
  return null; // fuera de zona de cobertura
}

function parseLatLng(locationUrl: string): { lat: number; lng: number } | null {
  const m = locationUrl.match(/q=([-\d.]+),([-\d.]+)/);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

async function logOrder(
  items: ReturnType<typeof useCart>['items'],
  total: number,
  orderId: string,
  locationUrl?: string,
  paymentMethod?: PaymentMethod,
  discountCode?: string,
  deliveryFee?: number,
) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items, total, orderId,
        sessionId: getSessionId(),
        locationUrl,
        paymentMethod,
        discountCode,
        deliveryFee,
      }),
    });
  } catch {
    // fire-and-forget
  }
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; emoji: string }[] = [
  { id: 'efectivo',      label: 'Efectivo',      emoji: '💵' },
  { id: 'transferencia', label: 'Transferencia',  emoji: '🏦' },
  { id: 'debito',        label: 'Débito/Crédito', emoji: '💳' },
];

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
  debito:        'Débito / Crédito',
};

export default function CartDrawer() {
  const { items, updateQty, removeItem, clearCart, total, count, isOpen, setIsOpen } = useCart();
  const { waNumber, waGreeting, waFooter, delivery } = useSettings();
  const { state: geo, request: requestGeo, clear: clearGeo } = useGeolocation();
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod | null>(null);
  const [discountInput, setDiscountInput]   = useState('');
  const [discountStatus, setDiscountStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');
  const [discountError,  setDiscountError]  = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  const locationUrl = geo.status === 'success' ? geo.locationUrl : undefined;

  /* ── delivery fee ────────────────────────── */
  const deliveryInfo = (() => {
    if (!delivery?.enabled || !locationUrl) return null;
    if (!delivery.restaurantLat || !delivery.restaurantLng) return null;
    const coords = parseLatLng(locationUrl);
    if (!coords) return null;
    const distKm = haversineKm(delivery.restaurantLat, delivery.restaurantLng, coords.lat, coords.lng);
    const fee    = calcDeliveryFee(distKm, delivery);
    return { distKm, fee };
  })();
  const deliveryFee = deliveryInfo?.fee ?? null;

  /* ── descuento ───────────────────────────── */

  function calcDiscount(dis: AppliedDiscount, rawTotal: number): number {
    return dis.type === 'percent'
      ? Math.round(rawTotal * dis.value / 100)
      : dis.value;
  }

  const discountAmount = appliedDiscount ? calcDiscount(appliedDiscount, total) : 0;
  const finalTotal     = Math.max(0, total - discountAmount) + (deliveryFee ?? 0);

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setDiscountStatus('loading');
    setDiscountError('');
    try {
      const res  = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        const amount = data.type === 'percent'
          ? Math.round(total * data.value / 100)
          : data.value;
        setAppliedDiscount({ code, type: data.type, value: data.value, display: data.display, amount });
        setDiscountStatus('applied');
        setDiscountInput('');
      } else {
        setDiscountError(data.error ?? 'Código inválido');
        setDiscountStatus('error');
      }
    } catch {
      setDiscountError('Error al validar el código');
      setDiscountStatus('error');
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountStatus('idle');
    setDiscountInput('');
    setDiscountError('');
  }

  /* ── mensaje WhatsApp ────────────────────── */

  const buildWAMsg = (orderId: string) => {
    const lines = [`🧾 Pedido ${orderId}`, waGreeting, ''];
    items.forEach((item, i) => {
      const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
      lines.push(`${i + 1}. ${item.qty}x ${item.name}${item.size ? ` (${item.size.toUpperCase()})` : ''} — ${fmt((item.price + extrasTotal) * item.qty)}`);
      if (item.desc)                         lines.push(`   📋 ${item.desc}`);
      if (item.removedIngredients?.length)   lines.push(`   ❌ Sin: ${item.removedIngredients.join(', ')}`);
      if (item.extras?.length)               lines.push(`   ➕ ${item.extras.map(e => e.price > 0 ? `${e.name} (+${fmt(e.price)})` : e.name).join(', ')}`);
      if (item.note)                         lines.push(`   📝 Nota: ${item.note}`);
    });
    lines.push('');
    lines.push(`💰 Subtotal: ${fmt(total)}`);
    if (appliedDiscount) lines.push(`🏷 Descuento (${appliedDiscount.code}): -${fmt(discountAmount)}`);
    if (deliveryFee != null) lines.push(`🛵 Delivery (${deliveryInfo!.distKm.toFixed(1)} km): ${fmt(deliveryFee)}`);
    if (deliveryInfo && deliveryInfo.fee === null) lines.push(`🛵 Delivery: fuera de cobertura`);
    lines.push(`💰 TOTAL: ${fmt(finalTotal)}`);
    if (paymentMethod) lines.push(`💳 Pago: ${PAYMENT_LABEL[paymentMethod]}`);
    if (locationUrl)   lines.push(`📍 Mi ubicación: ${locationUrl}`);
    if (waFooter)      lines.push('', waFooter);
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleSend = () => {
    const orderId = generateOrderId();
    logOrder(items, finalTotal, orderId, locationUrl, paymentMethod ?? undefined, appliedDiscount?.code, deliveryFee ?? undefined);
    window.open(buildWAMsg(orderId), '_blank');
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center' }}>
      <div onClick={() => setIsOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'var(--max)', background:'var(--card)', borderRadius:'var(--radius) var(--radius) 0 0', maxHeight:'85dvh', display:'flex', flexDirection:'column', animation:'slideUp .3s ease', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)' }}>Tu pedido</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>{count} {count === 1 ? 'producto' : 'productos'}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {items.length > 0 && <button onClick={clearCart} style={{ fontSize:12, color:'var(--text-muted)', background:'transparent', border:'1px solid var(--border)', borderRadius:999, padding:'4px 10px', cursor:'pointer', fontWeight:600 }}>Vaciar</button>}
            <button onClick={() => setIsOpen(false)} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
        </div>

        {/* Items */}
        <div style={{ overflowY:'auto', flex:1, padding:'12px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🛒</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:18 }}>Tu carrito está vacío</div>
              <div style={{ fontSize:13, marginTop:6 }}>Agrega productos desde el menú</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {items.map(item => (
                <div key={item.id} style={{ background:'var(--bg2)', borderRadius:'var(--radius-sm)', padding:'12px 14px', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text)', lineHeight:1.2 }}>
                        {item.name}
                        {item.size && <span style={{ fontSize:12, color:'var(--orange)', fontWeight:900, marginLeft:6, background:'rgba(242,100,25,0.1)', padding:'1px 5px', borderRadius:4 }}>{item.size.toUpperCase()}</span>}
                      </div>
                      {item.desc && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2, lineHeight:1.4 }}>{item.desc}</div>}
                      {item.removedIngredients?.length ? <div style={{ fontSize:12, color:'#ef4444', marginTop:2, lineHeight:1.5 }}>❌ Sin: {item.removedIngredients.join(', ')}</div> : null}
                      {item.extras?.length ? <div style={{ fontSize:12, color:'var(--orange)', marginTop:2, lineHeight:1.5 }}>➕ {item.extras.map(e => e.name).join(', ')}</div> : null}
                      {item.note && <div style={{ fontSize:12, color:'var(--orange)', marginTop:3, fontStyle:'italic' }}>📝 {item.note}</div>}
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', padding:4, flexShrink:0, opacity:.6 }}><TrashIcon size={14}/></button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border)', borderRadius:999, overflow:'hidden', background:'var(--card)' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width:32, height:32, border:'none', background:'transparent', cursor:'pointer', fontSize:16, color:'var(--text)', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <span style={{ padding:'0 10px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--text)' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width:32, height:32, border:'none', background:'transparent', cursor:'pointer', fontSize:16, color:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                    </div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--yellow)' }}>{fmt((item.price + (item.extras ?? []).reduce((s, e) => s + e.price, 0)) * item.qty)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding:'16px 20px 32px', borderTop:'1px solid var(--border)', flexShrink:0 }}>

            {/* Total */}
            <div style={{ marginBottom:14 }}>
              {appliedDiscount && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>Subtotal</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-muted)' }}>{fmt(total)}</span>
                </div>
              )}
              {appliedDiscount && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>🏷 {appliedDiscount.display}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'#16a34a' }}>-{fmt(discountAmount)}</span>
                </div>
              )}
              {deliveryFee != null && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>🛵 Delivery · {deliveryInfo!.distKm.toFixed(1)} km</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text)' }}>{fmt(deliveryFee)}</span>
                </div>
              )}
              {deliveryInfo && deliveryInfo.fee === null && (
                <div style={{ fontSize:12, color:'#dc2626', fontWeight:600, marginBottom:4 }}>
                  🛵 {deliveryInfo.distKm.toFixed(1)} km — fuera de nuestra zona de cobertura
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-muted)' }}>TOTAL</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'var(--text)' }}>{fmt(finalTotal)}</span>
              </div>
            </div>

            {/* Código de descuento */}
            <div style={{ marginBottom:12 }}>
              {discountStatus !== 'applied' ? (
                <div>
                  <div style={{ display:'flex', gap:6 }}>
                    <input
                      value={discountInput}
                      onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountStatus('idle'); setDiscountError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                      placeholder="Código de descuento"
                      style={{ flex:1, padding:'8px 12px', borderRadius:8, border:`1.5px solid ${discountStatus === 'error' ? '#dc2626' : 'var(--border)'}`, background:'var(--bg2)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none' }}
                    />
                    <button onClick={applyDiscount} disabled={discountStatus === 'loading' || !discountInput.trim()}
                      style={{ padding:'8px 14px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: (discountStatus === 'loading' || !discountInput.trim()) ? 'not-allowed' : 'pointer', opacity: (discountStatus === 'loading' || !discountInput.trim()) ? 0.6 : 1, whiteSpace:'nowrap' }}>
                      {discountStatus === 'loading' ? '…' : 'Aplicar'}
                    </button>
                  </div>
                  {discountStatus === 'error' && (
                    <div style={{ fontSize:12, color:'#dc2626', marginTop:5, fontWeight:600 }}>⚠ {discountError}</div>
                  )}
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(22,163,74,0.08)', border:'1px solid rgba(22,163,74,0.25)', borderRadius:8, padding:'8px 12px' }}>
                  <div>
                    <span style={{ fontSize:13, color:'#16a34a', fontWeight:700 }}>🏷 {appliedDiscount?.code}</span>
                    <span style={{ fontSize:12, color:'#16a34a', marginLeft:6 }}>{appliedDiscount?.display}</span>
                  </div>
                  <button onClick={removeDiscount} style={{ fontSize:12, color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', fontWeight:600 }}>Quitar</button>
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', marginBottom:7 }}>
                Método de pago
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {PAYMENT_OPTIONS.map(opt => {
                  const sel = paymentMethod === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setPaymentMethod(sel ? null : opt.id)}
                      style={{ flex:1, padding:'9px 4px', borderRadius:10, border:`2px solid ${sel ? 'var(--orange)' : 'var(--border)'}`, background: sel ? 'rgba(242,100,25,0.08)' : 'var(--bg2)', cursor:'pointer', transition:'all .15s', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{ fontSize:18 }}>{opt.emoji}</span>
                      <span style={{ fontSize:11, fontWeight:700, color: sel ? 'var(--orange)' : 'var(--text-muted)', lineHeight:1.2, textAlign:'center' }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ubicación */}
            <div style={{ marginBottom:12 }}>
              {geo.status === 'idle' && (
                <button onClick={requestGeo} style={{ width:'100%', padding:'9px', borderRadius:'var(--radius-sm)', border:'1px dashed var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  📍 Incluir mi ubicación (opcional)
                </button>
              )}
              {geo.status === 'loading' && (
                <div style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', padding:'9px' }}>Obteniendo ubicación…</div>
              )}
              {geo.status === 'success' && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:'var(--radius-sm)', padding:'8px 12px' }}>
                  <span style={{ fontSize:13, color:'#1a8a3e', fontWeight:600 }}>📍 Ubicación incluida</span>
                  <button onClick={clearGeo} style={{ fontSize:12, color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', fontWeight:600 }}>Quitar</button>
                </div>
              )}
              {geo.status === 'denied' && (
                <div style={{ fontSize:12, color:'#dc2626', padding:'8px 10px', background:'rgba(220,38,38,0.05)', borderRadius:8, lineHeight:1.5 }}>
                  🔒 <strong>Ubicación bloqueada para este sitio.</strong>{' '}
                  Toca el candado en la barra del navegador → <em>Permisos → Ubicación → Permitir</em>, y se activará automáticamente.
                </div>
              )}
              {geo.status === 'unavailable' && (
                <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'6px' }}>
                  Ubicación no disponible en este dispositivo
                </div>
              )}
              {(geo.status === 'timeout' || geo.status === 'error') && (
                <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span>No se pudo obtener la ubicación</span>
                  <button onClick={requestGeo} style={{ fontSize:11, fontWeight:700, color:'var(--orange)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline' }}>Reintentar</button>
                </div>
              )}
            </div>

            <button onClick={handleSend} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#25D366', color:'#fff', padding:'15px 24px', borderRadius:999, border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:.5, cursor:'pointer', boxShadow:'0 4px 16px rgba(37,211,102,0.3)' }}>
              <WAIcon size={20} color="#fff"/> Enviar pedido por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
