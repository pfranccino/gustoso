'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { fmt } from '@/lib/menuData';

export default function CartBar() {
  const { count, total, setIsOpen } = useCart();
  const [popped, setPopped] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    if (count > prevCount.current) {
      setPopped(true);
      setTimeout(() => setPopped(false), 300);
    }
    prevCount.current = count;
  }, [count]);

  if (count === 0) return null;

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:400, display:'flex', justifyContent:'center', padding:'12px 16px 20px', background:'linear-gradient(0deg, var(--bg) 60%, transparent)', pointerEvents:'none' }}>
      <button onClick={() => setIsOpen(true)} style={{ pointerEvents:'all', width:'100%', maxWidth:'var(--max)', padding:'14px 20px', borderRadius:'var(--r-pill)', border:'none', background:'var(--brand-500)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'var(--glow-brand)', transform: popped ? 'scale(1.03)' : 'scale(1)', transition:'transform .15s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:'rgba(255,255,255,0.25)', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:15, transform: popped ? 'scale(1.3)' : 'scale(1)', transition:'transform .3s' }}>{count}</div>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:18, letterSpacing:.5 }}>Ver pedido</span>
        </div>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:18 }}>{fmt(total)}</span>
      </button>
    </div>
  );
}
