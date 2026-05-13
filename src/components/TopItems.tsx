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

  // Para cada top entry, buscar el MenuItem correspondiente (precio, etc.)
  const matched = top
    .map(t => ({ ...t, item: menuItems.find(m => m.name.trim() === t.name && m.visible) }))
    .filter(t => t.item) as (TopEntry & { item: MenuItem })[];

  if (matched.length === 0) return null;

  function handleAdd(item: MenuItem) {
    // Si tiene precio simple, agregar directo
    if (item.price !== null) {
      addItem({ name: item.name, price: item.price, desc: item.desc ?? undefined });
      setIsOpen(true);
    }
    // Si es dual, abrir el carrito para que elija tamaño (simplificado: agregar Normal)
    else if (item.priceNormal !== null) {
      addItem({ name: item.name, price: item.priceNormal, size: 'normal', desc: item.desc ?? undefined });
      setIsOpen(true);
    }
  }

  return (
    <div style={{ padding:'24px 0 8px' }}>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:20 }}>🔥</span>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)', lineHeight:1 }}>Lo más pedido</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Los favoritos de nuestros clientes</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
          {matched.map(({ name, count, item }) => {
            const price = item.price ?? item.priceNormal;
            return (
              <button key={name} onClick={() => handleAdd(item)}
                style={{ flexShrink:0, width:140, background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 12px', textAlign:'left', cursor:'pointer', transition:'border-color .15s', display:'flex', flexDirection:'column', gap:6 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--orange)', letterSpacing:1, textTransform:'uppercase' }}>
                  {count} pedido{count !== 1 ? 's' : ''}
                </div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, color:'var(--text)', lineHeight:1.2 }}>
                  {name}
                </div>
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
    </div>
  );
}
