'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { fmt, type SimpleItem, type DualItem } from '@/lib/menuData';

type Props = {
  item: SimpleItem | DualItem;
  isDual: boolean;
  onClose: () => void;
};

export default function AddToCartModal({ item, isDual, onClose }: Props) {
  const { addItem } = useCart();
  const [size, setSize] = useState<'normal' | 'xl'>('normal');
  const [note, setNote] = useState('');
  const [qty,  setQty]  = useState(1);

  const price = isDual
    ? (size === 'normal' ? (item as DualItem).priceNormal : (item as DualItem).priceXL)
    : (item as SimpleItem).price;

  const confirm = () => {
    for (let i = 0; i < qty; i++) {
      addItem({ name: item.name, desc: item.desc, price, size: isDual ? size : undefined, note: note.trim() || undefined });
    }
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'var(--max)', background:'var(--card)', borderRadius:'var(--radius) var(--radius) 0 0', padding:'24px 20px 36px', animation:'slideUp .3s ease', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)' }}></div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--text)', marginBottom:4 }}>{item.name}</div>
        {item.desc && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>{item.desc}</div>}

        {isDual && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Tamaño</div>
            <div style={{ display:'flex', gap:8 }}>
              {(['normal', 'xl'] as const).map(s => (
                <button key={s} onClick={() => setSize(s)} style={{ flex:1, padding:'10px', borderRadius:999, border:`2px solid ${size === s ? 'var(--orange)' : 'var(--border)'}`, background: size === s ? 'rgba(242,100,25,0.1)' : 'transparent', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, color: size === s ? 'var(--orange)' : 'var(--text)', textTransform:'uppercase' }}>{s === 'xl' ? 'XL' : 'Normal'}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--yellow)' }}>{fmt(s === 'normal' ? (item as DualItem).priceNormal : (item as DualItem).priceXL)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--yellow)' }}>{fmt(price * qty)}</div>
        </div>

        <button onClick={confirm} style={{ width:'100%', padding:'14px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, cursor:'pointer' }}>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
