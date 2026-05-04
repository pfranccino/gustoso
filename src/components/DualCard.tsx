'use client';

import { useState } from 'react';
import { fmt, type DualItem } from '@/lib/menuData';
import AddToCartModal from './AddToCartModal';

export default function DualCard({ item }: { item: DualItem }) {
  const [modal, setModal] = useState(false);
  return (
    <>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:17, color:'var(--text)', lineHeight:1.2 }}>{item.name}</div>
          {item.desc && <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3, fontWeight:500 }}>{item.desc}</div>}
          <div style={{ display:'flex', gap:10, marginTop:4, alignItems:'center' }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--yellow)' }}>{fmt(item.priceNormal)}</span>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Normal</span>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--orange-light)' }}>{fmt(item.priceXL)}</span>
            <span style={{ fontSize:11, color:'var(--orange)', fontWeight:700, background:'rgba(242,100,25,0.1)', padding:'1px 5px', borderRadius:4 }}>XL</span>
          </div>
        </div>
        <button onClick={() => setModal(true)} style={{ width:40, height:40, borderRadius:'50%', border:'2px solid var(--orange)', background:'var(--orange)', color:'#fff', fontSize:22, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
      </div>
      {modal && <AddToCartModal item={item} isDual={true} onClose={() => setModal(false)} />}
    </>
  );
}
