'use client';

import { useCart } from '@/contexts/CartContext';
import { Promotion } from '@/lib/firestore/promotions';

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  PROMO:    { bg: '#F26419', color: '#fff' },
  OFERTA:   { bg: '#dc2626', color: '#fff' },
  NUEVO:    { bg: '#16a34a', color: '#fff' },
  COMBO:    { bg: '#7c3aed', color: '#fff' },
  ESPECIAL: { bg: '#d97706', color: '#fff' },
};

export default function PromoCard({ promo }: { promo: Promotion }) {
  const { addItem } = useCart();

  function handleAdd() {
    addItem({ name: promo.name, desc: promo.description, price: promo.price });
  }

  const badge = promo.badge ? BADGE_COLOR[promo.badge] : null;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1.5px solid rgba(242,100,25,0.25)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Accent stripe */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#F26419,#ffb347)' }}/>

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 900, letterSpacing: 1.2,
            padding: '3px 8px', borderRadius: 5,
            background: badge.bg, color: badge.color,
            flexShrink: 0, marginTop: 2,
          }}>
            {promo.badge}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--text)', lineHeight: 1.15 }}>
            {promo.name}
          </div>
          {promo.description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
              {promo.description}
            </div>
          )}
        </div>
      </div>

      {/* Items included */}
      {promo.items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {promo.items.map((it, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text)', fontWeight:500 }}>
              <span style={{ color:'#F26419', fontWeight:900, fontSize:14, lineHeight:1 }}>✓</span>
              {it}
            </div>
          ))}
        </div>
      )}

      {/* Price + Add */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--orange)' }}>
          {fmt(promo.price)}
        </span>
        <button onClick={handleAdd}
          style={{ padding:'9px 20px', borderRadius:999, border:'none', background:'#F26419', color:'#fff',
            fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15,
            cursor:'pointer', boxShadow:'0 3px 10px rgba(242,100,25,0.3)' }}>
          + Agregar
        </button>
      </div>
    </div>
  );
}
