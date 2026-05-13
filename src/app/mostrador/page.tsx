'use client';

import { useState, useEffect, useCallback } from 'react';
import { PaymentMethod } from '@/lib/firestore/orders';

/* ── tipos ─────────────────────────────────────── */
type Item = {
  id: string; name: string; category: string;
  price: number | null; priceNormal: number | null; priceXL: number | null;
  visible: boolean; sortOrder: number;
};
type Line = { item: Item; size: 'normal' | 'xl' | null; qty: number };

const CATS: Record<string, string> = {
  vienesas:'🌭 Vienesas', as:'🥪 AS', churrasco:'🥩 Churrasco',
  mechada:'🥖 Mechada', papas:'🍟 Papas & Más', bebidas:'🥤 Bebidas', burrito:'🌯 Burrito',
};

const PAYMENT: { id: PaymentMethod; label: string; emoji: string }[] = [
  { id:'efectivo',      label:'Efectivo',      emoji:'💵' },
  { id:'transferencia', label:'Transf.',        emoji:'🏦' },
  { id:'debito',        label:'Débito',         emoji:'💳' },
];

function fmt(n: number) {
  return n.toLocaleString('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 });
}

function getSessionId() {
  const k = 'gustosos_mostrador_sid';
  let s = sessionStorage.getItem(k);
  if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(k, s); }
  return s;
}

async function generateOrderId(): Promise<string> {
  try {
    const r = await fetch('/api/orders/next-id');
    return (await r.json()).orderId;
  } catch {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'GST-';
    for (let i = 0; i < 4; i++) id += c[Math.floor(Math.random() * c.length)];
    return id;
  }
}

function printComanda(orderId: string, lines: Line[], total: number, payment: PaymentMethod | null) {
  const now = new Date();
  const rows = lines.map(l => {
    const p = l.size === 'xl' ? (l.item.priceXL ?? 0) : l.size === 'normal' ? (l.item.priceNormal ?? 0) : (l.item.price ?? 0);
    return `<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px dashed #ccc">
      <div style="font-weight:bold;font-size:15px">${l.qty}× ${l.item.name}${l.size === 'xl' ? ' <span style="font-size:12px">(XL)</span>' : l.size === 'normal' ? ' <span style="font-size:12px">(Normal)</span>' : ''}</div>
      <div style="font-size:12px;color:#555;margin-top:2px">Subtotal: ${fmt(p * l.qty)}</div>
    </div>`;
  }).join('');

  const payLabel = payment === 'efectivo' ? 'Efectivo' : payment === 'transferencia' ? 'Transferencia' : payment === 'debito' ? 'Débito/Crédito' : '—';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comanda ${orderId}</title>
  <style>body{font-family:'Courier New',monospace;max-width:300px;margin:0 auto;padding:16px;font-size:13px}
  h2{text-align:center;margin:0 0 4px;font-size:16px}.sub{text-align:center;font-size:12px;color:#666;margin-bottom:12px}
  .total{font-size:18px;font-weight:bold;text-align:right;margin-top:12px;border-top:2px solid #000;padding-top:8px}
  @media print{button{display:none}}</style></head>
  <body>
    <h2>🏪 MOSTRADOR</h2>
    <div class="sub">${orderId} · ${now.toLocaleDateString('es-CL')} ${now.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}</div>
    <hr/>${rows}
    <div class="total">TOTAL: ${fmt(total)}</div>
    <div style="text-align:right;font-size:12px;margin-top:4px">Pago: ${payLabel}</div>
    <br/><button onclick="window.print()" style="width:100%;padding:10px;background:#000;color:#fff;border:none;font-size:14px;cursor:pointer">🖨️ Imprimir</button>
    <script>window.onload=function(){window.print();}<\/script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=380,height=620');
  if (w) { w.document.write(html); w.document.close(); }
}

/* ── pantalla de PIN ────────────────────────────── */
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState(false);
  const [loading, setLoading] = useState(false);

  const digits = [1,2,3,4,5,6,7,8,9,'←',0,'✓'] as const;

  function press(d: typeof digits[number]) {
    if (d === '←') { setPin(p => p.slice(0,-1)); setError(false); return; }
    if (d === '✓') { verify(); return; }
    if (pin.length < 6) setPin(p => p + d);
  }

  async function verify() {
    if (!pin) return;
    setLoading(true); setError(false);
    try {
      const r = await fetch('/api/mostrador/auth', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ pin }),
      });
      const { ok } = await r.json();
      if (ok) {
        sessionStorage.setItem('mostrador_auth', '1');
        onSuccess();
      } else {
        setError(true); setPin('');
      }
    } catch {
      setError(true); setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
      <div style={{ textAlign:'center', width:300 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🏪</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'#f8fafc', marginBottom:4 }}>Gustoso&apos;s Mostrador</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginBottom:32 }}>Ingresa el PIN de turno</div>

        {/* Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:24 }}>
          {Array.from({length:4}).map((_,i) => (
            <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: pin.length > i ? '#f26419' : '#334155', transition:'background .15s' }}/>
          ))}
        </div>

        {error && <div style={{ fontSize:13, color:'#ef4444', fontWeight:700, marginBottom:16 }}>PIN incorrecto. Intenta de nuevo.</div>}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {digits.map((d,i) => (
            <button key={i} onClick={() => !loading && press(d)}
              style={{ padding:'18px 0', borderRadius:12, border:'none', fontSize: d === '✓' ? 20 : 22, fontWeight:700, cursor:'pointer', transition:'all .1s',
                background: d === '✓' ? '#f26419' : d === '←' ? '#334155' : '#1e293b',
                color: d === '✓' ? '#fff' : d === '←' ? '#94a3b8' : '#f8fafc',
                opacity: loading ? 0.5 : 1 }}>
              {loading && d === '✓' ? '…' : d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── pantalla principal split-screen ───────────── */
function MostradorScreen() {
  const [items,   setItems]   = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat,     setCat]     = useState('');
  const [cart,    setCart]    = useState<Line[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>('efectivo');
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then((data: Item[]) => {
      const visible = data.filter(m => m.visible).sort((a,b) => a.sortOrder - b.sortOrder);
      setItems(visible);
      if (visible.length) setCat(visible[0].category);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* categorías presentes en el menú */
  const categories = Array.from(new Set(items.map(m => m.category)));

  /* items filtrados */
  const displayed = search.trim()
    ? items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : items.filter(m => m.category === cat);

  /* cart helpers */
  function linePrice(l: Line) {
    if (l.size === 'xl')     return (l.item.priceXL     ?? 0) * l.qty;
    if (l.size === 'normal') return (l.item.priceNormal ?? 0) * l.qty;
    return (l.item.price ?? 0) * l.qty;
  }
  const total = cart.reduce((s,l) => s + linePrice(l), 0);

  function addLine(item: Item, size: 'normal' | 'xl' | null) {
    setCart(prev => {
      const ex = prev.find(l => l.item.id === item.id && l.size === size);
      if (ex) return prev.map(l => l.item.id === item.id && l.size === size ? {...l, qty:l.qty+1} : l);
      return [...prev, { item, size, qty:1 }];
    });
  }
  function setQty(item: Item, size: 'normal' | 'xl' | null, delta: number) {
    setCart(prev => prev.map(l => l.item.id === item.id && l.size === size ? {...l, qty:l.qty+delta} : l).filter(l => l.qty > 0));
  }

  const handleConfirm = useCallback(async () => {
    if (!cart.length || saving) return;
    setSaving(true);
    try {
      const orderId = await generateOrderId();
      const apiItems = cart.map(l => ({
        name:  l.item.name + (l.size === 'xl' ? ' XL' : l.size === 'normal' ? ' Normal' : ''),
        qty:   l.qty,
        price: l.size === 'xl' ? (l.item.priceXL ?? 0) : l.size === 'normal' ? (l.item.priceNormal ?? 0) : (l.item.price ?? 0),
      }));
      const res = await fetch('/api/orders', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ items:apiItems, total, orderId, sessionId:getSessionId(), paymentMethod:payment, source:'local' }),
      });
      if (!res.ok) { alert('Error al guardar el pedido'); return; }
      printComanda(orderId, cart, total, payment);
      setCart([]);
    } finally {
      setSaving(false);
    }
  }, [cart, total, payment, saving]);

  function lock() {
    sessionStorage.removeItem('mostrador_auth');
    window.location.reload();
  }

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#0f172a', color:'#f8fafc', fontFamily:"'Barlow',sans-serif", overflow:'hidden' }}>

      {/* Top bar */}
      <div style={{ height:52, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #1e293b', background:'#0f172a' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#f8fafc', letterSpacing:.5 }}>
          🏪 <span style={{ color:'#f26419' }}>Gustoso&apos;s</span> — Mostrador
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:12, color:'#64748b' }}>{new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}</div>
          <button onClick={lock} title="Bloquear"
            style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#64748b', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            🔒 Bloquear
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── LEFT: Menú ── */}
        <div style={{ flex:'0 0 62%', display:'flex', flexDirection:'column', borderRight:'1px solid #1e293b', overflow:'hidden' }}>

          {/* Buscador */}
          <div style={{ padding:'12px 16px 8px', flexShrink:0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto…"
              style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1px solid #334155', background:'#1e293b', color:'#f8fafc', fontSize:14, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }}/>
          </div>

          {/* Categorías */}
          {!search.trim() && (
            <div style={{ display:'flex', gap:6, padding:'0 16px 10px', flexShrink:0, overflowX:'auto' }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  style={{ padding:'7px 14px', borderRadius:999, border:'none', whiteSpace:'nowrap', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s',
                    background: cat === c ? '#f26419' : '#1e293b',
                    color:      cat === c ? '#fff' : '#94a3b8' }}>
                  {CATS[c] ?? c}
                </button>
              ))}
            </div>
          )}

          {/* Items */}
          <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>Cargando menú…</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
                {displayed.map(m => {
                  const isDual = m.priceNormal != null;
                  return (
                    <div key={m.id} style={{ background:'#1e293b', borderRadius:12, padding:'14px 12px', border:'1px solid #334155', display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'#f8fafc', lineHeight:1.2 }}>{m.name}</div>
                      {isDual ? (
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => addLine(m,'normal')}
                            style={{ flex:1, padding:'8px 4px', borderRadius:8, border:'1.5px solid #f26419', background:'transparent', color:'#f26419', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            +N<br/><span style={{ fontSize:10 }}>{fmt(m.priceNormal ?? 0)}</span>
                          </button>
                          <button onClick={() => addLine(m,'xl')}
                            style={{ flex:1, padding:'8px 4px', borderRadius:8, border:'none', background:'#f26419', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                            +XL<br/><span style={{ fontSize:10 }}>{fmt(m.priceXL ?? 0)}</span>
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addLine(m,null)}
                          style={{ width:'100%', padding:'9px', borderRadius:8, border:'none', background:'#f26419', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>
                          + {fmt(m.price ?? 0)}
                        </button>
                      )}
                    </div>
                  );
                })}
                {displayed.length === 0 && <div style={{ color:'#64748b', padding:20, fontSize:13 }}>Sin resultados</div>}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Carrito ── */}
        <div style={{ flex:'0 0 38%', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          <div style={{ padding:'14px 16px 8px', flexShrink:0, borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'#f8fafc' }}>
              Pedido {cart.length > 0 && <span style={{ fontSize:14, color:'#f26419' }}>({cart.reduce((s,l) => s+l.qty,0)} items)</span>}
            </span>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{ fontSize:11, color:'#64748b', background:'transparent', border:'1px solid #334155', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
                Vaciar
              </button>
            )}
          </div>

          {/* Lines */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#475569' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🛒</div>
                <div style={{ fontSize:13 }}>Selecciona productos del menú</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {cart.map((l,i) => {
                  const p = l.size === 'xl' ? (l.item.priceXL ?? 0) : l.size === 'normal' ? (l.item.priceNormal ?? 0) : (l.item.price ?? 0);
                  return (
                    <div key={i} style={{ background:'#1e293b', borderRadius:10, padding:'10px 12px', border:'1px solid #334155' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:'#f8fafc', lineHeight:1.2 }}>
                          {l.item.name}
                          {l.size && <span style={{ fontSize:11, color:'#f26419', marginLeft:5 }}>{l.size.toUpperCase()}</span>}
                        </div>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, color:'#f26419', flexShrink:0 }}>
                          {fmt(p * l.qty)}
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <button onClick={() => setQty(l.item, l.size, -1)}
                          style={{ width:28, height:28, borderRadius:6, border:'1px solid #334155', background:'transparent', color:'#f8fafc', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'#f8fafc', minWidth:24, textAlign:'center' }}>{l.qty}</span>
                        <button onClick={() => setQty(l.item, l.size, 1)}
                          style={{ width:28, height:28, borderRadius:6, border:'none', background:'#f26419', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                        <span style={{ fontSize:12, color:'#64748b', marginLeft:'auto' }}>{fmt(p)} c/u</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer fijo */}
          <div style={{ flexShrink:0, padding:'12px 16px 20px', borderTop:'1px solid #1e293b' }}>

            {/* Total */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:'#94a3b8' }}>TOTAL</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color:'#f8fafc' }}>{fmt(total)}</span>
            </div>

            {/* Método de pago */}
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              {PAYMENT.map(p => (
                <button key={p.id} onClick={() => setPayment(p.id)}
                  style={{ flex:1, padding:'8px 4px', borderRadius:9, border:`2px solid ${payment === p.id ? '#f26419' : '#334155'}`, background: payment === p.id ? 'rgba(242,100,25,0.15)' : 'transparent', cursor:'pointer', transition:'all .15s', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <span style={{ fontSize:18 }}>{p.emoji}</span>
                  <span style={{ fontSize:10, fontWeight:700, color: payment === p.id ? '#f26419' : '#64748b' }}>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Confirmar */}
            <button onClick={handleConfirm} disabled={!cart.length || saving}
              style={{ width:'100%', padding:'15px', borderRadius:12, border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, cursor: (!cart.length || saving) ? 'not-allowed' : 'pointer', transition:'all .15s',
                background: !cart.length ? '#1e293b' : '#f26419',
                color: !cart.length ? '#475569' : '#fff',
                boxShadow: cart.length ? '0 4px 20px rgba(242,100,25,0.35)' : 'none' }}>
              {saving ? 'Guardando…' : '🖨️ Confirmar e imprimir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── entry point ────────────────────────────────── */
export default function MostradorPage() {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    setAuth(sessionStorage.getItem('mostrador_auth') === '1');
  }, []);

  if (auth === null) return null; // evita flash
  if (!auth)        return <PinScreen onSuccess={() => setAuth(true)} />;
  return <MostradorScreen />;
}
