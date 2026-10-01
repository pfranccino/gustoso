'use client';

import { useState } from 'react';
import { fmt } from '@/lib/menuData';
import { MenuItem } from '@/lib/firestore/menuItems';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import AddToCartModal from './AddToCartModal';

export default function DualCard({ item, aderezos = [], disabledIngredients = [] }: { item: MenuItem; aderezos?: Aderezo[]; disabledIngredients?: string[] }) {
  const [modal, setModal] = useState(false);
  return (
    <>
      <div style={{ background:'var(--surface-raised)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        {item.imageUrl && (
          <div style={{ width:56, height:56, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
            <img src={item.imageUrl} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:17, color:'var(--ink-900)', lineHeight:1.2 }}>{item.name}</div>
          {(() => {
            const enabled = item.ingredients.filter(i => i.enabled);
            if (item.desc) return <div style={{ fontSize:13, color:'var(--ink-500)', marginTop:3, fontWeight:500 }}>{item.desc}</div>;
            if (enabled.length === 0) return null;
            return (
              <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:3, fontWeight:500, lineHeight:1.6 }}>
                {enabled.map(i => {
                  const off = disabledIngredients.includes(i.name);
                  return <span key={i.name} style={{ textDecoration: off ? 'line-through' : 'none', opacity: off ? 0.45 : 1, marginRight:4 }}>{i.name}{!off && ' ·'}</span>;
                })}
              </div>
            );
          })()}
          <div style={{ display:'flex', gap:10, marginTop:4, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--gold)' }}>{fmt(item.priceNormal!)}</span>
            <span style={{ fontSize:11, color:'var(--ink-500)', fontWeight:600 }}>Normal</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--brand)' }}>{fmt(item.priceXL!)}</span>
            <span style={{ fontSize:11, color:'var(--brand)', fontWeight:700, background:'var(--brand-soft)', padding:'1px 5px', borderRadius:4 }}>XL</span>
            {item.extras.length > 0 && <span style={{ fontSize:11, color:'var(--brand)', fontWeight:700, background:'var(--brand-soft)', padding:'1px 6px', borderRadius:4 }}>+ opcionales</span>}
          </div>
        </div>
        <button onClick={() => setModal(true)} style={{ width:36, height:36, borderRadius:'50%', border:'none', background:'var(--brand)', color:'#fff', fontSize:20, fontWeight:300, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow-brand)', transition:'transform .15s' }}>+</button>
      </div>
      {modal && <AddToCartModal item={item} aderezos={aderezos} disabledIngredients={disabledIngredients} onClose={() => setModal(false)} />}
    </>
  );
}
