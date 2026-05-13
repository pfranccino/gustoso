'use client';

import { useState } from 'react';
import { fmt } from '@/lib/menuData';
import { MenuItem } from '@/lib/firestore/menuItems';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import AddToCartModal from './AddToCartModal';

export default function FeaturedCard({ item, aderezos = [], disabledIngredients = [] }: { item: MenuItem; aderezos?: Aderezo[]; disabledIngredients?: string[] }) {
  const [modal, setModal] = useState(false);
  const isDual = item.priceNormal != null;

  return (
    <>
      <div style={{
        position:'relative',
        background:'linear-gradient(135deg, var(--card) 0%, var(--bg2) 100%)',
        border:'1.5px solid var(--border-strong)',
        borderRadius:18, padding:'14px 14px 14px 14px',
        display:'flex', gap:14, alignItems:'center',
        gridColumn:'1 / -1',
      }}>
        {/* Badge */}
        <div style={{ position:'absolute', top:0, left:0, padding:'4px 10px', background:'var(--orange)', color:'#fff', fontSize:9, fontWeight:800, letterSpacing:1, borderRadius:'18px 0 18px 0' }}>
          🔥 MÁS PEDIDO
        </div>

        {/* Photo / fallback */}
        <div style={{ width:86, height:86, borderRadius:10, overflow:'hidden', flexShrink:0 }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,var(--bg2) 0%,var(--bg3) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--orange)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, textAlign:'center', padding:6, lineHeight:1.2 }}>
                {item.name.split(' ').slice(0,2).join(' ')}
              </div>
          }
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0, paddingTop:12 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, color:'var(--text)', lineHeight:1.2 }}>{item.name}</div>
          {item.desc && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2, fontWeight:500 }}>{item.desc}</div>}
          <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap', marginTop:6 }}>
            {isDual ? (
              <>
                <div>
                  <span style={{ fontSize:9, fontWeight:800, color:'var(--text-muted)', letterSpacing:.8, textTransform:'uppercase', marginRight:4 }}>Normal</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--yellow)' }}>{fmt(item.priceNormal!)}</span>
                </div>
                <div>
                  <span style={{ fontSize:9, fontWeight:800, color:'var(--orange)', letterSpacing:.8, textTransform:'uppercase', marginRight:4, background:'rgba(242,100,25,0.08)', padding:'1px 5px', borderRadius:3 }}>XL</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--orange)' }}>{fmt(item.priceXL!)}</span>
                </div>
              </>
            ) : (
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--yellow)' }}>{fmt(item.price!)}</span>
            )}
          </div>
        </div>

        {/* Add button — 36×36 circle */}
        <button onClick={() => setModal(true)}
          style={{ width:36, height:36, borderRadius:'50%', border:'none', background:'var(--orange)', color:'#fff', fontSize:20, fontWeight:300, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(242,100,25,0.25)', transition:'transform .15s' }}>+</button>
      </div>
      {modal && <AddToCartModal item={item} aderezos={aderezos} disabledIngredients={disabledIngredients} onClose={() => setModal(false)}/>}
    </>
  );
}
