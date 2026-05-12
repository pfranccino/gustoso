'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Promotion } from '@/lib/firestore/promotions';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import { fmt } from '@/lib/menuData';

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  PROMO:    { bg: '#F26419', color: '#fff' },
  OFERTA:   { bg: '#dc2626', color: '#fff' },
  NUEVO:    { bg: '#16a34a', color: '#fff' },
  COMBO:    { bg: '#7c3aed', color: '#fff' },
  ESPECIAL: { bg: '#d97706', color: '#fff' },
};

export default function PromoCard({ promo, aderezos = [] }: { promo: Promotion; aderezos?: Aderezo[] }) {
  const { addItem } = useCart();
  const [modal, setModal] = useState(false);
  const [selectedAderezos, setSelectedAderezos] = useState<Aderezo[]>([]);

  const availableAderezos = aderezos.filter(a => a.available);
  const badge = promo.badge ? BADGE_COLOR[promo.badge] : null;

  function toggleAderezo(a: Aderezo) {
    setSelectedAderezos(prev =>
      prev.some(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]
    );
  }

  function handleAdd() {
    if (availableAderezos.length > 0) {
      setSelectedAderezos([]);
      setModal(true);
    } else {
      addItem({ name: promo.name, desc: promo.description, price: promo.price });
    }
  }

  function confirm() {
    const aderezosPrice = selectedAderezos.reduce((s, a) => s + a.price, 0);
    const aderezosArr = selectedAderezos.length > 0
      ? selectedAderezos.map(a => ({ name: a.name, price: a.price }))
      : undefined;
    addItem({ name: promo.name, desc: promo.description, price: promo.price + aderezosPrice, aderezos: aderezosArr, alwaysNew: selectedAderezos.length > 0 });
    setModal(false);
  }

  return (
    <>
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

      {/* Mini-modal aderezos */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
             onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={() => setModal(false)}/>
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'var(--max)', background:'var(--card)', borderRadius:'var(--radius) var(--radius) 0 0', padding:'24px 20px 36px', animation:'slideUp .3s ease', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'var(--text)' }}>{promo.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Elige tus aderezos (opcional)</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
              {availableAderezos.map(a => {
                const sel = selectedAderezos.some(x => x.id === a.id);
                return (
                  <button key={a.id} onClick={() => toggleAderezo(a)}
                    style={{ padding:'8px 14px', borderRadius:999, border:`1.5px solid ${sel ? 'var(--orange)' : 'var(--border)'}`, background: sel ? 'rgba(242,100,25,0.09)' : 'var(--bg2)', cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:14, fontWeight:700, color: sel ? 'var(--orange)' : 'var(--text)' }}>{a.name}</span>
                    {a.price > 0 && <span style={{ fontSize:12, color: sel ? 'var(--orange)' : 'var(--text-muted)' }}>+{fmt(a.price)}</span>}
                  </button>
                );
              })}
            </div>

            <button onClick={confirm}
              style={{ width:'100%', padding:'14px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor:'pointer' }}>
              Agregar al carrito {selectedAderezos.length > 0 ? `· ${selectedAderezos.length} aderezo${selectedAderezos.length > 1 ? 's' : ''}` : ''}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
