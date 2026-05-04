'use client';

import { useState } from 'react';
import { fmt, type SimpleItem } from '@/lib/menuData';
import AddToCartModal from './AddToCartModal';

export default function SimpleCard({ item }: { item: SimpleItem }) {
  const [modal, setModal] = useState(false);
  return (
    <>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:17, color:'var(--text)', lineHeight:1.2 }}>{item.name}</div>
          {item.desc && <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3, fontWeight:500 }}>{item.desc}</div>}
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--yellow)', marginTop:4 }}>{fmt(item.price)}</div>
        </div>
        <button onClick={() => setModal(true)} style={{ width:40, height:40, borderRadius:'50%', border:'2px solid var(--orange)', background:'var(--orange)', color:'#fff', fontSize:22, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
      </div>
      {modal && <AddToCartModal item={item} isDual={false} onClose={() => setModal(false)} />}
    </>
  );
}
