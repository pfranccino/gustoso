'use client';

import { useEffect, useState } from 'react';
import { MenuItem } from '@/lib/firestore/menuItems';
import { useCart } from '@/contexts/CartContext';

type TopEntry = { name: string; count: number };

export default function TopItems({ menuItems }: { menuItems: MenuItem[] }) {
  const [top, setTop] = useState<TopEntry[]>([]);
  const { addItem, setIsOpen } = useCart();

  useEffect(() => {
    fetch('/api/public/top-items')
      .then(r => r.json())
      .then((data: TopEntry[]) => setTop(data))
      .catch(() => {});
  }, []);

  if (top.length === 0) return null;

  const matched = top
    .map(t => ({ ...t, item: menuItems.find(m => m.name.trim() === t.name && m.visible) }))
    .filter(t => t.item) as (TopEntry & { item: MenuItem })[];

  if (matched.length === 0) return null;

  function handleAdd(item: MenuItem) {
    if (item.price !== null) {
      addItem({ name: item.name, price: item.price, desc: item.desc ?? undefined });
      setIsOpen(true);
    } else if (item.priceNormal !== null) {
      addItem({ name: item.name, price: item.priceNormal, size: 'normal', desc: item.desc ?? undefined });
      setIsOpen(true);
    }
  }

  return (
    <div className="top-items-wrap" style={{ padding:'24px 16px 8px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🔥</span>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)', lineHeight:1 }}>Lo más pedido esta semana</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Los favoritos de nuestros clientes</div>
          </div>
        </div>
        {/* Desktop: total pedidos */}
        <span className="top-items-count" style={{ display:'none', fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase' }}>
          Datos en vivo
        </span>
      </div>

      {/* Cards — horizontal scroll on mobile, 4-col grid on desktop */}
      <div className="top-items-list" style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
        {matched.map(({ name, count, item }, idx) => {
          const price = item.price ?? item.priceNormal;
          return (
            <button key={name} onClick={() => handleAdd(item)}
              className="top-items-card"
              style={{ flexShrink:0, width:160, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 12px', textAlign:'left', cursor:'pointer', transition:'border-color .15s, box-shadow .15s', display:'flex', flexDirection:'column', gap:6 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(242,100,25,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--orange)', lineHeight:1 }}>#{idx+1}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Top</span>
              </div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, color:'var(--text)', lineHeight:1.2 }}>{name}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{count} pedido{count !== 1 ? 's' : ''}</div>
              {price !== null && (
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--yellow)' }}>
                  ${price.toLocaleString('es-CL')}
                  {item.priceNormal !== null && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:3 }}>Normal</span>}
                </div>
              )}
              <div style={{ fontSize:11, color:'var(--orange)', fontWeight:700, marginTop:2 }}>+ Agregar →</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
