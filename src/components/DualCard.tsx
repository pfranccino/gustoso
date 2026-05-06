'use client';

import { useState } from 'react';
import { fmt } from '@/lib/menuData';
import { MenuItem } from '@/lib/firestore/menuItems';
import AddToCartModal from './AddToCartModal';

export default function DualCard({ item }: { item: MenuItem }) {
  const [modal, setModal] = useState(false);
  return (
    <>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:17, color:'var(--text)', lineHeight:1.2 }}>{item.name}</div>
          {(() => {
            const enabled = item.ingredients.filter(i => i.enabled);
            return item.desc
              ? <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3, fontWeight:500 }}>{item.desc}</div>
              : enabled.length > 0
                ? <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3, fontWeight:500, lineHeight:1.4 }}>{enabled.map(i => i.name).join(' · ')}</div>
                : null;
          })()}
          <div style={{ display:'flex', gap:10, marginTop:4, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--yellow)' }}>{fmt(item.priceNormal!)}</span>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Normal</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--orange-light)' }}>{fmt(item.priceXL!)}</span>
            <span style={{ fontSize:11, color:'var(--orange)', fontWeight:700, background:'rgba(242,100,25,0.1)', padding:'1px 5px', borderRadius:4 }}>XL</span>
            {item.extras.length > 0 && <span style={{ fontSize:11, color:'var(--orange)', fontWeight:700, background:'rgba(242,100,25,0.1)', padding:'1px 6px', borderRadius:4 }}>+ opcionales</span>}
          </div>
        </div>
        <button onClick={() => setModal(true)} style={{ width:40, height:40, borderRadius:'50%', border:'2px solid var(--orange)', background:'var(--orange)', color:'#fff', fontSize:22, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
      </div>
      {modal && <AddToCartModal item={item} onClose={() => setModal(false)} />}
    </>
  );
}
