'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { fmt } from '@/lib/menuData';
import { MenuItem, Extra } from '@/lib/firestore/menuItems';
import { Aderezo } from '@/lib/firestore/aderezosTypes';

export default function AddToCartModal({ item, onClose, aderezos = [], disabledIngredients = [] }: { item: MenuItem; onClose: () => void; aderezos?: Aderezo[]; disabledIngredients?: string[] }) {
  const { addItem } = useCart();
  const isDual = item.priceNormal != null;
  const [size, setSize]   = useState<'normal' | 'xl'>('normal');
  const [note, setNote]   = useState('');
  const [qty,  setQty]    = useState(1);
  const [selectedExtras, setSelectedExtras]         = useState<Extra[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(disabledIngredients);
  const [selectedAderezos, setSelectedAderezos]     = useState<Aderezo[]>([]);

  const availableAderezos = aderezos.filter(a => a.available);

  function toggleAderezo(a: Aderezo) {
    setSelectedAderezos(prev =>
      prev.some(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]
    );
  }

  const basePrice = isDual
    ? (size === 'normal' ? item.priceNormal! : item.priceXL!)
    : item.price!;

  const extrasTotal   = selectedExtras.reduce((s, e) => s + e.price, 0);
  const aderezosPrice = selectedAderezos.reduce((s, a) => s + a.price, 0);
  const unitPrice     = basePrice + extrasTotal + aderezosPrice;

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras(prev =>
      prev.some(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const toggleIngredient = (ing: string) => {
    setRemovedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const confirm = () => {
    const hasCustom = selectedExtras.length > 0 || !!note.trim() || removedIngredients.length > 0 || selectedAderezos.length > 0;
    const aderezosArr = selectedAderezos.length > 0
      ? selectedAderezos.map(a => ({ name: a.name, price: a.price }))
      : undefined;
    addItem({
      name:               item.name,
      desc:               item.desc ?? undefined,
      price:              basePrice + aderezosPrice,
      size:               isDual ? size : undefined,
      note:               note.trim() || undefined,
      extras:             selectedExtras.length > 0 ? selectedExtras : undefined,
      removedIngredients: removedIngredients.length > 0 ? removedIngredients : undefined,
      aderezos:           aderezosArr,
      alwaysNew:          hasCustom,
    });
    for (let i = 1; i < qty; i++) {
      addItem({
        name:               item.name,
        desc:               item.desc ?? undefined,
        price:              basePrice + aderezosPrice,
        size:               isDual ? size : undefined,
        note:               note.trim() || undefined,
        extras:             selectedExtras.length > 0 ? selectedExtras : undefined,
        removedIngredients: removedIngredients.length > 0 ? removedIngredients : undefined,
        aderezos:           aderezosArr,
        alwaysNew:          true,
      });
    }
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={onClose}/>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'var(--max)', background:'var(--card)', borderRadius:'var(--radius) var(--radius) 0 0', padding:'24px 20px 36px', animation:'slideUp .3s ease', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)', maxHeight:'90dvh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }}/>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--text)' }}>{item.name}</div>
          {item.volume && <span style={{ fontSize:12, fontWeight:700, color:'#0891b2', background:'rgba(8,145,178,0.1)', padding:'2px 8px', borderRadius:4 }}>🥤 {item.volume}</span>}
        </div>
        {item.desc && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>{item.desc}</div>}

        {/* Tamaño */}
        {isDual && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Tamaño</div>
            <div style={{ display:'flex', gap:8 }}>
              {(['normal', 'xl'] as const).map(s => (
                <button key={s} onClick={() => setSize(s)} style={{ flex:1, padding:'10px', borderRadius:999, border:`2px solid ${size === s ? 'var(--orange)' : 'var(--border)'}`, background: size === s ? 'rgba(242,100,25,0.1)' : 'transparent', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, color: size === s ? 'var(--orange)' : 'var(--text)', textTransform:'uppercase' }}>{s === 'xl' ? 'XL' : 'Normal'}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--yellow)' }}>{fmt(s === 'normal' ? item.priceNormal! : item.priceXL!)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ingredientes — el cliente puede quitar los que no quiere (solo los habilitados) */}
        {item.ingredients.filter(i => i.enabled).length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Ingredientes</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>Toca para quitar</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {item.ingredients.filter(i => i.enabled).map(ing => {
                const globallyDisabled = disabledIngredients.includes(ing.name);
                const removed = removedIngredients.includes(ing.name);
                if (globallyDisabled) {
                  return (
                    <span key={ing.name}
                      style={{ padding:'5px 12px', borderRadius:999, border:'1.5px solid rgba(220,38,38,0.4)', background:'rgba(220,38,38,0.06)', fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color:'#dc2626', textDecoration:'line-through', opacity:0.7, display:'inline-flex', alignItems:'center', gap:4 }}>
                      🚫 {ing.name}
                    </span>
                  );
                }
                return (
                  <button key={ing.name} onClick={() => toggleIngredient(ing.name)}
                    style={{ padding:'5px 12px', borderRadius:999, border:`1.5px solid ${removed ? 'rgba(220,38,38,0.5)' : 'var(--border)'}`, background: removed ? 'rgba(220,38,38,0.07)' : 'var(--bg2)', cursor:'pointer', fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color: removed ? '#dc2626' : 'var(--text)', textDecoration: removed ? 'line-through' : 'none', transition:'all .15s' }}>
                    {ing.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Extras opcionales */}
        {item.extras.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Extras opcionales</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {item.extras.map(extra => {
                const selected = selectedExtras.some(e => e.name === extra.name);
                return (
                  <button key={extra.name} onClick={() => toggleExtra(extra)}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:'var(--radius-sm)', border:`2px solid ${selected ? 'var(--orange)' : 'var(--border)'}`, background: selected ? 'rgba(242,100,25,0.08)' : 'var(--bg2)', cursor:'pointer', transition:'all .2s', textAlign:'left' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:18, height:18, borderRadius:4, border:`2px solid ${selected ? 'var(--orange)' : 'var(--border)'}`, background: selected ? 'var(--orange)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, color:'#fff', fontWeight:900 }}>
                        {selected ? '✓' : ''}
                      </span>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color:'var(--text)' }}>{extra.name}</span>
                    </div>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, color: extra.price > 0 ? 'var(--orange)' : '#22c55e' }}>
                      {extra.price > 0 ? `+${fmt(extra.price)}` : 'Gratis'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Aderezos */}
        {availableAderezos.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>🥫 Aderezos</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {availableAderezos.map(a => {
                const sel = selectedAderezos.some(x => x.id === a.id);
                return (
                  <button key={a.id} onClick={() => toggleAderezo(a)}
                    style={{ padding:'6px 13px', borderRadius:999, border:`1.5px solid ${sel ? 'var(--orange)' : 'var(--border)'}`, background: sel ? 'rgba(242,100,25,0.09)' : 'var(--bg2)', cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:13, fontWeight:700, color: sel ? 'var(--orange)' : 'var(--text)' }}>{a.name}</span>
                    {a.price > 0 && <span style={{ fontSize:11, color: sel ? 'var(--orange)' : 'var(--text-muted)' }}>+{fmt(a.price)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Nota */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Nota (opcional)</div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: sin cebolla, extra palta..." style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:14, fontFamily:'Barlow,sans-serif', outline:'none' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border)', borderRadius:999, overflow:'hidden' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width:40, height:40, border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--text)', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
            <span style={{ padding:'0 16px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'var(--text)', minWidth:36, textAlign:'center' }}>{qty}</span>
            <button onClick={() => setQty(q => q + 1)} style={{ width:40, height:40, border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          </div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--yellow)' }}>{fmt(unitPrice * qty)}</div>
        </div>

        <button onClick={confirm} style={{ width:'100%', padding:'14px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, cursor:'pointer' }}>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
