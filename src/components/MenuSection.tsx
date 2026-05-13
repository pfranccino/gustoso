'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/lib/firestore/menuItems';
import { BurritoConfig } from '@/lib/firestore/burritoConfig';
import { Promotion } from '@/lib/firestore/promotions';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
import { useCart } from '@/contexts/CartContext';
import SimpleCard from './SimpleCard';
import DualCard from './DualCard';
import SectionHeader from './SectionHeader';
import BurritoBuilder from './BurritoBuilder';
import PromoCard from './PromoCard';
import TopItems from './TopItems';

const TABS = [
  { id:'promos',    label:'Promos',      emoji:'🏷️' },
  { id:'vienesas',  label:'Vienesas',    emoji:'🌭' },
  { id:'as',        label:'AS',          emoji:'🥪' },
  { id:'churrasco', label:'Churrasco',   emoji:'🥩' },
  { id:'mechada',   label:'Mechada',     emoji:'🥖' },
  { id:'burrito',   label:'Burrito',     emoji:'🌯' },
  { id:'papas',     label:'Papas & Más', emoji:'🍟' },
  { id:'bebidas',   label:'Bebidas',     emoji:'🥤' },
] as const;

type TabId = typeof TABS[number]['id'];

/* ── Desktop cart sidebar ──────────────────────────────────────── */
function CartSidebar() {
  const { items, total, count, updateQty, setIsOpen } = useCart();
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;


  return (
    <aside style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'0 1px 2px rgba(60,30,10,0.04),0 8px 24px rgba(60,30,10,0.06)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--text)' }}>Tu pedido</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{count > 0 ? `${count} producto${count !== 1 ? 's' : ''}` : 'Vacío'}</div>
        </div>
        <span style={{ fontSize:18 }}>🛒</span>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:13, fontWeight:500 }}>
          Agrega productos del menú para empezar tu pedido
        </div>
      ) : (
        <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8, maxHeight:320, overflowY:'auto' }}>
          {items.map(it => (
            <div key={it.id} style={{ padding:'10px 12px', background:'var(--bg2)', borderRadius:8, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:'var(--text)', lineHeight:1.3, flex:1, marginRight:8 }}>{it.name}{it.size ? ` (${it.size})` : ''}</span>
                <button onClick={() => updateQty(it.id, -it.qty)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, lineHeight:1, padding:0, flexShrink:0 }}>🗑</button>
              </div>
              {it.note && <div style={{ fontSize:10, color:'var(--orange)', fontStyle:'italic', marginBottom:4 }}>📝 {it.note}</div>}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                {/* Qty controls */}
                <div style={{ display:'inline-flex', alignItems:'center', border:'1px solid var(--border)', borderRadius:999, overflow:'hidden', background:'var(--card)' }}>
                  <button onClick={() => updateQty(it.id, -1)} style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', fontSize:14, color:'var(--text)' }}>−</button>
                  <span style={{ padding:'0 8px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:12, color:'var(--text)' }}>{it.qty}</span>
                  <button onClick={() => updateQty(it.id, 1)} style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'none', cursor:'pointer', fontSize:14, color:'var(--orange)' }}>+</button>
                </div>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color:'var(--yellow)' }}>{fmt(it.price * it.qty)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <>
          <div style={{ padding:'10px 14px', borderTop:'1px dashed var(--border)', display:'flex', flexDirection:'column', gap:5 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, color:'var(--text-muted)', letterSpacing:.8, textTransform:'uppercase' }}>SUBTOTAL</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--text)' }}>{fmt(total)}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>+ Delivery calculado al confirmar por ubicación</div>
          </div>
        </>
      )}

      {/* Open full drawer */}
      {items.length > 0 && (
        <div style={{ padding:'0 14px 14px' }}>
          <button onClick={() => setIsOpen(true)} style={{ width:'100%', padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Ver detalles del pedido →
          </button>
        </div>
      )}
    </aside>
  );
}

/* ── Section number divider (desktop) ─────────────────────────── */
function NumDivider({ num, label }: { num: number; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'32px 0 16px' }}>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:72, color:'var(--orange)', lineHeight:.8, letterSpacing:-2 }}>{String(num).padStart(2,'0')}</span>
      <div style={{ flex:1, height:1, background:'var(--border)' }}></div>
      <span style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}

export default function MenuSection({ items, burritoConfig, promotions, aderezos = [], disabledIngredients: initialDisabled = [] }: { items: MenuItem[]; burritoConfig: BurritoConfig; promotions: Promotion[]; aderezos?: Aderezo[]; disabledIngredients?: string[] }) {
  const [disabledIngredients, setDisabledIngredients] = useState<string[]>(initialDisabled);

  useEffect(() => {
    fetch('/api/disabled-ingredients')
      .then(r => r.ok ? r.json() : null)
      .then((data: string[] | null) => { if (Array.isArray(data)) setDisabledIngredients(data); })
      .catch(() => {});
  }, []);

  const visiblePromos = promotions.filter(p => p.visible);
  const defaultTab: TabId = visiblePromos.length > 0 ? 'promos' : 'vienesas';

  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [search, setSearch] = useState('');

  const hasBebidas = items.some(i => i.category === 'bebidas' && i.visible);
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'promos')  return visiblePromos.length > 0;
    if (t.id === 'bebidas') return hasBebidas;
    return true;
  });

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    setSearch('');
  };

  const activeTabData = visibleTabs.find(t => t.id === activeTab);
  const tabLabel = activeTab==='churrasco'?'Sándwich Churrasco':activeTab==='mechada'?'Sándwich Mechada':activeTab==='burrito'?'Burrito Gustoso':activeTab==='papas'?'Papas & Más':activeTab==='promos'?'Promociones':activeTab==='bebidas'?'Bebidas':activeTabData?.label;

  const listStyle: React.CSSProperties = { display:'flex', flexDirection:'column', gap:10 };

  const catItems = items.filter(i => i.category === activeTab && i.visible);
  const isDual = (i: MenuItem) => i.priceNormal != null;

  const renderContent = () => {
    if (activeTab === 'promos') {
      return (
        <div style={listStyle}>
          {visiblePromos.map(p => <PromoCard key={p.id} promo={p} aderezos={aderezos} menuItems={items}/>)}
        </div>
      );
    }
    if (activeTab === 'burrito') return <BurritoBuilder config={burritoConfig}/>;
    if (activeTab === 'papas') {
      const grouped = catItems.reduce<Record<string, MenuItem[]>>((acc, it) => {
        const g = it.group ?? 'Papas & Más';
        (acc[g] ??= []).push(it);
        return acc;
      }, {});
      return (
        <div>
          {Object.entries(grouped).map(([g, its]) => (
            <div key={g}>
              <SectionHeader title={g}/>
              <div style={listStyle}>{its.map(i => isDual(i) ? <DualCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/> : <SimpleCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/>)}</div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={listStyle}>
        {catItems.map(i => isDual(i) ? <DualCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/> : <SimpleCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/>)}
      </div>
    );
  };

  const q = search.trim().toLowerCase();
  const searchResults = q
    ? items.filter(i =>
        i.visible && (
          i.name.toLowerCase().includes(q) ||
          i.ingredients.some(ing => ing.enabled && ing.name.toLowerCase().includes(q))
        )
      )
    : [];

  return (
    <section id="menu" style={{ paddingBottom:100 }}>
      {/* ── Sticky header (search + mobile tabs) ── */}
      <div className="menu-sticky-header" style={{ position:'sticky', top:52, zIndex:30, background:'rgba(255,249,245,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', padding:'10px 20px' }}>
        {/* Search bar */}
        <div style={{ position:'relative', marginBottom:8 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text-muted)', pointerEvents:'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto o ingrediente…"
            style={{ width:'100%', padding:'8px 32px 8px 34px', borderRadius:999, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted)', lineHeight:1 }}>×</button>
          )}
        </div>

        {/* Mobile tabs — 4×2 grid, hidden on desktop */}
        {!q && (
          <div className="menu-tabs-mobile" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {visibleTabs.map(tab => {
              const on = activeTab === tab.id;
              return (
                <button key={tab.id} data-tab={tab.id} onClick={() => switchTab(tab.id)} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  gap:3, padding:'8px 4px', borderRadius:10,
                  border: on ? '2px solid var(--orange)' : '2px solid transparent',
                  background: on ? 'var(--orange)' : 'var(--bg3)',
                  color: on ? '#fff' : 'var(--text-muted)',
                  fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11,
                  cursor:'pointer', transition:'all .2s', letterSpacing:.3,
                }}>
                  <span style={{ fontSize:18, lineHeight:1 }}>{tab.emoji}</span>
                  <span style={{ lineHeight:1.2, textAlign:'center' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Top items strip */}
      {!q && <TopItems menuItems={items}/>}

      {/* ── Desktop: number divider ── */}
      <div className="menu-content-wrap" style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'20px 16px 0' }}>
        {/* Desktop section header */}
        <div style={{ display:'none' }} className="menu-num-divider">
          <NumDivider num={1} label="NUESTRA CARTA"/>
        </div>

        {q ? (
          /* Search results */
          searchResults.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:14 }}>Sin resultados para <strong>"{search}"</strong></div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{search}"
              </div>
              <div style={listStyle}>
                {searchResults.map(i => isDual(i) ? <DualCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/> : <SimpleCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/>)}
              </div>
            </div>
          )
        ) : (
          /* ── Normal view — mobile single-col / desktop 3-col ── */
          <div className="menu-desktop-grid" style={{ display:'block' }}>

            {/* Left column: category rail — desktop only */}
            <div className="menu-cat-rail" style={{ display:'none' }}>
              <div style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Categorías</div>
              {visibleTabs.map(tab => {
                const on = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'10px 12px', borderRadius:10,
                    border: on ? `1px solid rgba(242,100,25,0.3)` : '1px solid transparent',
                    background: on ? 'rgba(242,100,25,0.08)' : 'transparent',
                    color: on ? 'var(--orange)' : 'var(--text-muted)',
                    cursor:'pointer', textAlign:'left',
                    fontFamily:"'Barlow Condensed',sans-serif", fontWeight: on ? 900 : 700, fontSize:14, letterSpacing:.4,
                    transition:'all .15s', width:'100%',
                  }}>
                    <span style={{ fontSize:18 }}>{tab.emoji}</span>
                    <span style={{ flex:1 }}>{tab.label}</span>
                    {on && <span style={{ fontSize:10, color:'var(--orange)' }}>→</span>}
                  </button>
                );
              })}
            </div>

            {/* Center column: products */}
            <div>
              {/* Category heading */}
              <div className="menu-section-head" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'0 0 0' }}>
                <span style={{ fontSize:24 }}>{activeTabData?.emoji}</span>
                <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--text)', letterSpacing:.3, lineHeight:1 }}>{tabLabel}</h2>
              </div>
              {activeTab === 'burrito' && <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14, fontWeight:500 }}>Arma tu Burrito o Bowl personalizado paso a paso</p>}
              {renderContent()}
            </div>

            {/* Right column: cart sidebar — desktop only */}
            <div className="menu-cart-sidebar" style={{ display:'none' }}>
              <CartSidebar/>
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
