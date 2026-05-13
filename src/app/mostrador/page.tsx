'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PaymentMethod } from '@/lib/firestore/orders';

/* ── tipos ─────────────────────────────────────── */
type Item = {
  id: string; name: string; category: string;
  price: number | null; priceNormal: number | null; priceXL: number | null;
  visible: boolean; sortOrder: number;
};
type Line = { item: Item; size: 'normal' | 'xl' | null; qty: number };
type LastOrder = { orderId: string; lines: Line[]; total: number; payment: PaymentMethod | null };

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
  <style>
    @page{margin:5mm}
    body{font-family:'Courier New',monospace;max-width:300px;margin:0 auto;padding:16px;font-size:13px}
    h2{text-align:center;margin:0 0 4px;font-size:16px}.sub{text-align:center;font-size:12px;color:#666;margin-bottom:12px}
    .total{font-size:18px;font-weight:bold;text-align:right;margin-top:12px;border-top:2px solid #000;padding-top:8px}
    @media print{button{display:none}}
  </style></head>
  <body>
    <h2>🏪 GUSTOSO&apos;S MOSTRADOR</h2>
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

/* ── pantalla pequeña ───────────────────────────── */
function MobileBlock() {
  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0f172a', color:'#f8fafc', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>🖥️</div>
      <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, marginBottom:8, color:'#f8fafc' }}>Pantalla muy pequeña</h1>
      <p style={{ fontSize:14, color:'#94a3b8', maxWidth:300, lineHeight:1.5 }}>El mostrador está optimizado para tablet o desktop. Por favor usa una pantalla más grande para registrar pedidos.</p>
    </div>
  );
}

/* ── pantalla de PIN ────────────────────────────── */
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin,     setPin]     = useState('');
  const [error,   setError]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
        setError(true);
        setPin('');
      }
    } catch {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      setError(true);
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
      <style>{`
        @keyframes pin-shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-7px)}
          80%{transform:translateX(7px)}
        }
        .pin-shaking { animation: pin-shake 0.5s ease; }
      `}</style>
      <div className={shaking ? 'pin-shaking' : ''} style={{ textAlign:'center', width:320, padding:'0 16px' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🏪</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'#f8fafc', marginBottom:4 }}>Gustoso&apos;s Mostrador</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginBottom:28 }}>Ingresa el PIN de turno</div>

        {/* 6 Dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:20 }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{
              width: i < pin.length ? 16 : 12,
              height: i < pin.length ? 16 : 12,
              borderRadius:'50%',
              background: i < pin.length ? '#f26419' : '#334155',
              transition:'all .15s',
              margin:'auto 0',
            }}/>
          ))}
        </div>

        {error && <div style={{ fontSize:13, color:'#ef4444', fontWeight:700, marginBottom:16 }}>PIN incorrecto. Intenta de nuevo.</div>}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {digits.map((d,i) => (
            <button key={i} onClick={() => !loading && press(d)}
              style={{ padding:'20px 0', borderRadius:12, border:'none', fontSize: d === '✓' ? 20 : 22, fontWeight:700, cursor:'pointer', transition:'all .1s',
                background: d === '✓' ? '#f26419' : d === '←' ? '#334155' : '#1e293b',
                color: d === '✓' ? '#fff' : d === '←' ? '#94a3b8' : '#f8fafc',
                opacity: loading ? 0.5 : 1 }}>
              {loading && d === '✓' ? '…' : d}
            </button>
          ))}
        </div>

        {/* Help link */}
        <button onClick={() => setShowHelp(h => !h)} style={{ background:'transparent', border:'none', color:'#475569', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
          ¿No tienes PIN?
        </button>
        {showHelp && (
          <div style={{ marginTop:12, padding:'12px 14px', background:'#1e293b', borderRadius:10, fontSize:12, color:'#94a3b8', textAlign:'left', lineHeight:1.6 }}>
            Pide al administrador que genere un PIN desde:<br/>
            <strong style={{ color:'#f8fafc' }}>/admin/settings → Mostrador</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── pantalla principal split-screen ───────────── */
function MostradorScreen() {
  const [items,     setItems]     = useState<Item[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [cat,       setCat]       = useState('');
  const [search,    setSearch]    = useState('');
  const [payment,   setPayment]   = useState<PaymentMethod>('efectivo');
  const [saving,    setSaving]    = useState(false);
  const [isMobile,  setIsMobile]  = useState(false);
  const [online,    setOnline]    = useState(true);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);

  /* Multi-cart: array of Line arrays */
  const [carts,      setCarts]      = useState<Line[][]>([[]]);
  const [activeCart, setActiveCart] = useState(0);
  const cart = carts[activeCart] ?? [];

  const searchRef = useRef<HTMLInputElement>(null);

  /* Stable lock fn */
  const lock = useCallback(() => {
    sessionStorage.removeItem('mostrador_auth');
    sessionStorage.removeItem('pos_carts');
    window.location.reload();
  }, []);

  /* Mobile detection */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Connection indicator */
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  /* Auto-lock after 5 min inactivity */
  useEffect(() => {
    let timer = setTimeout(lock, 5 * 60 * 1000);
    const reset = () => { clearTimeout(timer); timer = setTimeout(lock, 5 * 60 * 1000); };
    const events = ['click', 'keydown', 'mousemove', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, reset));
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [lock]);

  /* Restore carts from sessionStorage */
  useEffect(() => {
    const saved = sessionStorage.getItem('pos_carts');
    if (saved) {
      try {
        const { carts: sc, active } = JSON.parse(saved) as { carts: Line[][]; active: number };
        if (Array.isArray(sc) && sc.length > 0) {
          setCarts(sc);
          setActiveCart(typeof active === 'number' ? Math.min(active, sc.length - 1) : 0);
        }
      } catch {}
    }
  }, []);

  /* Persist carts */
  useEffect(() => {
    sessionStorage.setItem('pos_carts', JSON.stringify({ carts, active: activeCart }));
  }, [carts, activeCart]);

  /* Load menu */
  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then((data: Item[]) => {
      const visible = data.filter(m => m.visible).sort((a,b) => a.sortOrder - b.sortOrder);
      setItems(visible);
      if (visible.length) setCat(visible[0].category);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(items.map(m => m.category)));

  const displayed = search.trim()
    ? items.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : items.filter(m => m.category === cat);

  /* Cart helpers */
  function updateCartLines(updater: (lines: Line[]) => Line[]) {
    setCarts(prev => prev.map((c, i) => i === activeCart ? updater(c) : c));
  }
  function addLine(item: Item, size: 'normal' | 'xl' | null) {
    updateCartLines(lines => {
      const ex = lines.find(l => l.item.id === item.id && l.size === size);
      if (ex) return lines.map(l => l.item.id === item.id && l.size === size ? {...l, qty:l.qty+1} : l);
      return [...lines, { item, size, qty:1 }];
    });
  }
  function setQty(item: Item, size: 'normal' | 'xl' | null, delta: number) {
    updateCartLines(lines =>
      lines.map(l => l.item.id === item.id && l.size === size ? {...l, qty:l.qty+delta} : l)
           .filter(l => l.qty > 0)
    );
  }
  function clearCart() {
    updateCartLines(() => []);
  }

  function linePrice(l: Line) {
    if (l.size === 'xl')     return (l.item.priceXL     ?? 0) * l.qty;
    if (l.size === 'normal') return (l.item.priceNormal ?? 0) * l.qty;
    return (l.item.price ?? 0) * l.qty;
  }
  const total = cart.reduce((s,l) => s + linePrice(l), 0);
  const totalQty = cart.reduce((s,l) => s + l.qty, 0);
  const isCompact = totalQty >= 8;

  /* Multi-cart actions */
  function addNewCart() {
    setCarts(prev => [...prev, []]);
    setActiveCart(carts.length); // carts.length = new index after push
  }
  function closeCart(i: number) {
    if (carts.length <= 1) { clearCart(); return; }
    const next = carts.filter((_, idx) => idx !== i);
    setCarts(next);
    setActiveCart(Math.min(activeCart, next.length - 1));
  }

  /* Confirm order */
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
      setLastOrder({ orderId, lines:[...cart], total, payment });
      printComanda(orderId, cart, total, payment);
      clearCart();
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, total, payment, saving]);

  /* Keyboard shortcuts */
  const cartRef      = useRef(cart);
  const confirmRef   = useRef(handleConfirm);
  const categoriesRef = useRef(categories);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { confirmRef.current = handleConfirm; }, [handleConfirm]);
  useEffect(() => { categoriesRef.current = categories; }, [categories]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); confirmRef.current(); return; }
      if (e.key === 'Escape' && cartRef.current.length > 0) {
        if (confirm('¿Vaciar el carrito actual?')) {
          setCarts(prev => prev.map((c, i) => i === activeCart ? [] : c));
        }
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (categoriesRef.current[idx]) {
          setCat(categoriesRef.current[idx]);
          setSearch('');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // activeCart needed for Escape handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCart]);

  /* Mobile block */
  if (isMobile) return <MobileBlock />;

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#0f172a', color:'#f8fafc', fontFamily:"'Barlow',sans-serif", overflow:'hidden' }}>

      {/* Top bar */}
      <div style={{ height:52, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', borderBottom:'1px solid #1e293b', background:'#0f172a' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#f8fafc', letterSpacing:.5 }}>
          🏪 <span style={{ color:'#f26419' }}>Gustoso&apos;s</span> — Mostrador
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Connection indicator */}
          {!online && (
            <span style={{ fontSize:11, color:'#ef4444', fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#ef4444', display:'inline-block' }}/>
              SIN CONEXIÓN
            </span>
          )}
          {online && (
            <span style={{ fontSize:11, color:'#22c55e', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
              En línea
            </span>
          )}
          <div style={{ fontSize:12, color:'#64748b' }}>{new Date().toLocaleDateString('es-CL',{weekday:'short',day:'numeric',month:'short'})}</div>
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
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto… ( / )"
              style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1px solid #334155', background:'#1e293b', color:'#f8fafc', fontSize:14, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }}/>
          </div>

          {/* Categorías */}
          {!search.trim() && (
            <div style={{ display:'flex', gap:6, padding:'0 16px 10px', flexShrink:0, overflowX:'auto' }}>
              {categories.map((c,i) => (
                <button key={c} onClick={() => setCat(c)}
                  style={{ padding:'7px 14px', borderRadius:999, border:'none', whiteSpace:'nowrap', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s',
                    background: cat === c ? '#f26419' : '#1e293b',
                    color:      cat === c ? '#fff' : '#94a3b8' }}>
                  {CATS[c] ?? c}
                  {i < 9 && <span style={{ fontSize:9, opacity:.5, marginLeft:4 }}>{i+1}</span>}
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
                      ) : m.category === 'burrito' ? (
                        <div style={{ padding:'8px', borderRadius:8, border:'1px dashed #334155', fontSize:11, color:'#64748b', textAlign:'center', lineHeight:1.4 }}>
                          Armar desde app del cliente
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

          {/* Hotkey hints footer */}
          <div style={{ flexShrink:0, padding:'6px 16px', borderTop:'1px solid #1e293b', display:'flex', gap:16, flexWrap:'wrap' }}>
            {[['/', 'buscar'], ['1-9', 'categoría'], ['Ctrl+↵', 'confirmar'], ['Esc', 'vaciar']].map(([k,l]) => (
              <span key={k} style={{ fontSize:10, color:'#475569' }}>
                <kbd style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:3, padding:'1px 4px', fontFamily:'monospace', fontSize:9 }}>{k}</kbd>
                {' '}{l}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Carrito ── */}
        <div style={{ flex:'0 0 38%', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Multi-cart tabs */}
          <div style={{ display:'flex', gap:4, padding:'8px 12px', borderBottom:'1px solid #1e293b', flexShrink:0, overflowX:'auto' }}>
            {carts.map((c, i) => {
              const qty = c.reduce((s,l) => s+l.qty, 0);
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
                  <button onClick={() => setActiveCart(i)}
                    style={{ padding:'5px 10px', borderRadius:7, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s',
                      background: activeCart === i ? '#f26419' : '#1e293b',
                      color:      activeCart === i ? '#fff' : '#94a3b8' }}>
                    #{i+1}{qty > 0 && ` · ${qty}`}
                  </button>
                  {carts.length > 1 && (
                    <button onClick={() => closeCart(i)}
                      style={{ width:16, height:16, borderRadius:4, border:'none', background:'transparent', color:'#475569', fontSize:10, cursor:'pointer', padding:0, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            {carts.length < 6 && (
              <button onClick={addNewCart}
                style={{ padding:'5px 10px', borderRadius:7, border:'1px dashed #334155', background:'transparent', color:'#475569', fontSize:12, cursor:'pointer', flexShrink:0 }}>
                + Nuevo
              </button>
            )}
          </div>

          {/* Cart header */}
          <div style={{ padding:'10px 16px 8px', flexShrink:0, borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'#f8fafc' }}>
              Pedido #{activeCart+1} {cart.length > 0 && <span style={{ fontSize:14, color:'#f26419' }}>({totalQty} items)</span>}
              {isCompact && <span style={{ fontSize:10, color:'#64748b', marginLeft:6 }}>· compacto</span>}
            </span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {cart.length > 0 && (
                <button onClick={clearCart} style={{ fontSize:11, color:'#64748b', background:'transparent', border:'1px solid #334155', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Lines */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px 0', color:'#475569' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🛒</div>
                <div style={{ fontSize:13, marginBottom:16 }}>Selecciona productos del menú</div>
                {/* Reimprimir última comanda */}
                {lastOrder && (
                  <button onClick={() => printComanda(lastOrder.orderId, lastOrder.lines, lastOrder.total, lastOrder.payment)}
                    style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #334155', background:'transparent', color:'#64748b', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    🖨️ Reimprimir última comanda · {lastOrder.orderId}
                  </button>
                )}
              </div>
            ) : isCompact ? (
              /* Compact mode for 8+ items */
              <div style={{ display:'flex', flexDirection:'column' }}>
                {cart.map((l,i) => {
                  const p = l.size === 'xl' ? (l.item.priceXL ?? 0) : l.size === 'normal' ? (l.item.priceNormal ?? 0) : (l.item.price ?? 0);
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px', borderBottom:'1px solid #1e293b', height:40 }}>
                      <span style={{ flex:1, fontSize:12, color:'#f8fafc', lineHeight:1.2 }}>
                        {l.item.name}
                        {l.size && <span style={{ fontSize:10, color:'#f26419', marginLeft:4 }}>{l.size.toUpperCase()}</span>}
                      </span>
                      <button onClick={() => setQty(l.item, l.size, -1)}
                        style={{ width:22, height:22, borderRadius:4, border:'1px solid #334155', background:'transparent', color:'#f8fafc', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                      <span style={{ fontSize:13, fontWeight:700, color:'#f8fafc', minWidth:16, textAlign:'center' }}>{l.qty}</span>
                      <button onClick={() => setQty(l.item, l.size, 1)}
                        style={{ width:22, height:22, borderRadius:4, border:'none', background:'#f26419', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                      <span style={{ fontSize:12, fontWeight:700, color:'#f26419', minWidth:64, textAlign:'right' }}>{fmt(p * l.qty)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Normal mode */
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

  if (auth === null) return null;
  if (!auth)        return <PinScreen onSuccess={() => setAuth(true)} />;
  return <MostradorScreen />;
}
