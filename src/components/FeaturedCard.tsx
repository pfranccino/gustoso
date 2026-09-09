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
        background:'linear-gradient(135deg, var(--surface-0) 0%, var(--surface-2) 100%)',
        border:'1.5px solid var(--line-brand)',
        borderRadius:'var(--r-lg)', padding:'14px 14px 14px 14px',
        boxShadow:'var(--e-2)',
        display:'flex', gap:14, alignItems:'center',
        gridColumn:'1 / -1',
      }}>
        {/* Badge */}
        <div style={{ position:'absolute', top:0, left:0, padding:'4px 10px', background:'var(--brand-500)', color:'#fff', fontSize:9, fontWeight:800, letterSpacing:1, borderRadius:'var(--r-lg) 0 var(--r-lg) 0' }}>
          🔥 MÁS PEDIDO
        </div>

        {/* Photo / fallback */}
        <div style={{ width:86, height:86, borderRadius:'var(--r-md)', overflow:'hidden', flexShrink:0 }}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,var(--surface-2) 0%,var(--surface-3) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--brand-600)', fontFamily:'var(--font-display)', fontWeight:900, fontSize:13, textAlign:'center', padding:6, lineHeight:1.2 }}>
                {item.name.split(' ').slice(0,2).join(' ')}
              </div>
          }
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0, paddingTop:12 }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:19, color:'var(--ink-900)', lineHeight:1.2 }}>{item.name}</div>
          {item.desc && <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2, fontWeight:500 }}>{item.desc}</div>}
          <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap', marginTop:6 }}>
            {isDual ? (
              <>
                <div>
                  <span style={{ fontSize:9, fontWeight:800, color:'var(--ink-400)', letterSpacing:.8, textTransform:'uppercase', marginRight:4 }}>Normal</span>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:17, color:'var(--ink-900)' }}>{fmt(item.priceNormal!)}</span>
                </div>
                <div>
                  <span style={{ fontSize:9, fontWeight:800, color:'var(--brand-600)', letterSpacing:.8, textTransform:'uppercase', marginRight:4, background:'var(--brand-50)', padding:'1px 5px', borderRadius:3 }}>XL</span>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:17, color:'var(--brand-600)' }}>{fmt(item.priceXL!)}</span>
                </div>
              </>
            ) : (
              <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:18, color:'var(--ink-900)' }}>{fmt(item.price!)}</span>
            )}
          </div>
        </div>

        {/* Add button — 36×36 circle */}
        <button onClick={() => setModal(true)}
          style={{ width:36, height:36, borderRadius:'50%', border:'none', background:'var(--brand-500)', color:'#fff', fontSize:20, fontWeight:300, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--glow-brand)', transition:'transform .15s' }}>+</button>
      </div>
      {modal && <AddToCartModal item={item} aderezos={aderezos} disabledIngredients={disabledIngredients} onClose={() => setModal(false)}/>}
    </>
  );
}
