'use client';

import { useCart } from '@/contexts/CartContext';
import { fmt } from '@/lib/menuData';
import { useSettings } from '@/contexts/SettingsContext';
import { TrashIcon, WAIcon } from './icons';
import { useGeolocation } from '@/hooks/useGeolocation';

function getSessionId(): string {
  const key = 'gustosos_sid';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

async function logOrder(
  items: ReturnType<typeof useCart>['items'],
  total: number,
  locationUrl?: string
) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        total,
        sessionId: getSessionId(),
        locationUrl,
      }),
    });
  } catch {
    // fire-and-forget — no bloquea el pedido si falla
  }
}

export default function CartDrawer() {
  const { items, updateQty, removeItem, clearCart, total, count, isOpen, setIsOpen } = useCart();
  const { waNumber } = useSettings();
  const { state: geo, request: requestGeo, clear: clearGeo } = useGeolocation();

  const locationUrl = geo.status === 'success' ? geo.locationUrl : undefined;

  const buildWAMsg = () => {
    const lines = ["Hola Gustoso's! Quiero hacer un pedido 🛒", ''];
    items.forEach((item, i) => {
      const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
      lines.push(`${i + 1}. ${item.qty}x ${item.name}${item.size ? ` (${item.size.toUpperCase()})` : ''} — ${fmt((item.price + extrasTotal) * item.qty)}`);
      if (item.desc) lines.push(`   📋 ${item.desc}`);
      if (item.extras?.length) lines.push(`   ➕ ${item.extras.map(e => e.price > 0 ? `${e.name} (+${fmt(e.price)})` : e.name).join(', ')}`);
      if (item.note) lines.push(`   📝 Nota: ${item.note}`);
    });
    lines.push('');
    lines.push(`💰 TOTAL: ${fmt(total)}`);
    if (locationUrl) lines.push(`📍 Mi ubicación: ${locationUrl}`);
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleSend = () => {
    logOrder(items, total, locationUrl);
    window.open(buildWAMsg(), '_blank');
  };

  if (!isOpen) return null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center' }}>
      <div onClick={() => setIsOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}></div>
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
                      {item.extras && item.extras.length > 0 && <div style={{ fontSize:12, color:'var(--orange)', marginTop:2, lineHeight:1.5 }}>➕ {item.extras.map(e => e.name).join(', ')}</div>}
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
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-muted)' }}>TOTAL</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'var(--text)' }}>{fmt(total)}</span>
            </div>

            {/* Geolocation */}
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
                <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'6px' }}>
                  Permiso bloqueado — actívalo en el candado 🔒 de la barra del navegador
                </div>
              )}
              {geo.status === 'unavailable' && (
                <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'6px' }}>
                  Ubicación no disponible — activa los servicios de ubicación en tu dispositivo
                </div>
              )}
              {geo.status === 'timeout' && (
                <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span>No respondió a tiempo</span>
                  <button onClick={requestGeo} style={{ fontSize:11, fontWeight:700, color:'var(--orange)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline' }}>Reintentar</button>
                </div>
              )}
              {geo.status === 'error' && (
                <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'6px' }}>No se pudo obtener la ubicación</div>
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
