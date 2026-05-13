'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Promotion, PromoChoice } from '@/lib/firestore/promotions';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import { MenuItem } from '@/lib/firestore/menuItems';
import { fmt } from '@/lib/menuData';

const BADGE_COLOR: Record<string, { bg: string; color: string }> = {
  PROMO:    { bg: '#F26419', color: '#fff' },
  OFERTA:   { bg: '#dc2626', color: '#fff' },
  NUEVO:    { bg: '#16a34a', color: '#fff' },
  COMBO:    { bg: '#7c3aed', color: '#fff' },
  ESPECIAL: { bg: '#d97706', color: '#fff' },
};

/** Resuelve las opciones de una choice.
 *  - category + options vacío  → todos los items visibles de esa categoría
 *  - category + options con items → solo esos items (lista blanca)
 *  - sin category               → opciones manuales */
function resolveOptions(choice: PromoChoice, menuItems: MenuItem[]): string[] {
  if (choice.category) {
    const all = menuItems
      .filter(m => m.category === choice.category && m.visible)
      .map(m => m.volume ? `${m.name} ${m.volume}` : m.name);
    if (choice.options.length > 0) {
      const whitelist = new Set(choice.options);
      return all.filter(name => whitelist.has(name));
    }
    return all;
  }
  return choice.options;
}

export default function PromoCard({ promo, aderezos = [], menuItems = [] }: { promo: Promotion; aderezos?: Aderezo[]; menuItems?: MenuItem[] }) {
  const { addItem } = useCart();
  const [modal, setModal] = useState(false);
  const [selectedAderezos, setSelectedAderezos] = useState<Aderezo[]>([]);
  // choices: { [label]: selected option }
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [choiceError, setChoiceError] = useState('');

  const availableAderezos = aderezos.filter(a => a.available);
  const hasChoices = promo.choices.length > 0;
  const badge = promo.badge ? BADGE_COLOR[promo.badge] : null;

  function toggleAderezo(a: Aderezo) {
    setSelectedAderezos(prev =>
      prev.some(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]
    );
  }

  function selectChoice(label: string, option: string) {
    setSelectedChoices(prev => ({ ...prev, [label]: option }));
    setChoiceError('');
  }

  function handleAdd() {
    if (hasChoices || availableAderezos.length > 0) {
      setSelectedAderezos([]);
      setSelectedChoices({});
      setChoiceError('');
      setModal(true);
    } else {
      addItem({ name: promo.name, desc: promo.description, price: promo.price });
    }
  }

  function confirm() {
    // Validate required choices
    const missing = promo.choices.filter(c => c.required && !selectedChoices[c.label]);
    if (missing.length > 0) {
      setChoiceError(`Elige: ${missing.map(c => c.label).join(', ')}`);
      return;
    }
    const aderezosPrice = selectedAderezos.reduce((s, a) => s + a.price, 0);
    const aderezosArr = selectedAderezos.length > 0
      ? selectedAderezos.map(a => ({ name: a.name, price: a.price }))
      : undefined;
    const choicesArr = Object.keys(selectedChoices).length > 0
      ? Object.entries(selectedChoices).map(([label, selected]) => ({ label, selected }))
      : undefined;
    const hasCustom = !!aderezosArr || !!choicesArr;
    addItem({ name: promo.name, desc: promo.description, price: promo.price + aderezosPrice, aderezos: aderezosArr, choices: choicesArr, alwaysNew: hasCustom });
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

        {/* Price + Add */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--orange)' }}>
            {fmt(promo.price)}
          </span>
          <button onClick={handleAdd} aria-label="Agregar al carrito"
            style={{ width:36, height:36, borderRadius:'50%', border:'none', background:'#F26419', color:'#fff', fontSize:20, fontWeight:300, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(242,100,25,0.25)', transition:'transform .15s' }}>
            +
          </button>
        </div>
      </div>

      {/* Modal opciones + aderezos */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
             onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={() => setModal(false)}/>
          <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'var(--max)', background:'var(--card)', borderRadius:'var(--radius) var(--radius) 0 0', padding:'24px 20px 36px', animation:'slideUp .3s ease', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)', maxHeight:'90dvh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'var(--text)' }}>{promo.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{fmt(promo.price)}</div>
              </div>
              <button onClick={() => setModal(false)} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:18, color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>

            {/* Choices */}
            {promo.choices.map(choice => {
              const opts = resolveOptions(choice, menuItems);
              return (
                <div key={choice.label} style={{ marginBottom:18 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>
                    {choice.label}{choice.required && <span style={{ color:'#dc2626', marginLeft:4 }}>*</span>}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {opts.map(opt => {
                      const sel = selectedChoices[choice.label] === opt;
                      return (
                        <button key={opt} onClick={() => selectChoice(choice.label, opt)}
                          style={{ padding:'8px 16px', borderRadius:999, border:`2px solid ${sel ? 'var(--orange)' : 'var(--border)'}`, background: sel ? 'rgba(242,100,25,0.1)' : 'var(--bg2)', cursor:'pointer', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color: sel ? 'var(--orange)' : 'var(--text)', transition:'all .15s' }}>
                          {opt}
                        </button>
                      );
                    })}
                    {opts.length === 0 && <span style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>Sin opciones disponibles</span>}
                  </div>
                </div>
              );
            })}

            {/* Aderezos */}
            {availableAderezos.length > 0 && (
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>🥫 Aderezos</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
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
              </div>
            )}

            {choiceError && (
              <div style={{ fontSize:13, color:'#dc2626', fontWeight:700, marginBottom:12, padding:'8px 12px', background:'rgba(220,38,38,0.06)', borderRadius:8 }}>
                ⚠️ {choiceError}
              </div>
            )}

            <button onClick={confirm}
              style={{ width:'100%', padding:'14px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor:'pointer' }}>
              Agregar al carrito
            </button>
          </div>
        </div>
      )}
    </>
  );
}
