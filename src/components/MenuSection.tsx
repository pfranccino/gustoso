'use client';

import { useRef, useState, useEffect } from 'react';
import { MenuItem } from '@/lib/firestore/menuItems';
import { BurritoConfig } from '@/lib/firestore/burritoConfig';
import { Promotion } from '@/lib/firestore/promotions';
import { Aderezo } from '@/lib/firestore/aderezosTypes';
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

function SizeHint() {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:12, padding:'8px 12px', background:'var(--bg2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>Toca <strong style={{ color:'var(--orange)' }}>+</strong> para elegir tamaño y agregar al carrito</span>
    </div>
  );
}

export default function MenuSection({ items, burritoConfig, promotions, aderezos = [], disabledIngredients: initialDisabled = [] }: { items: MenuItem[]; burritoConfig: BurritoConfig; promotions: Promotion[]; aderezos?: Aderezo[]; disabledIngredients?: string[] }) {
  const [disabledIngredients, setDisabledIngredients] = useState<string[]>(initialDisabled);

  // Fetch fresco al montar — sobreescribe el valor ISR con datos en tiempo real
  useEffect(() => {
    fetch('/api/disabled-ingredients')
      .then(r => r.ok ? r.json() : null)
      .then((data: string[] | null) => { if (Array.isArray(data)) setDisabledIngredients(data); })
      .catch(() => {/* usa el valor inicial del SSR */});
  }, []);

  const visiblePromos = promotions.filter(p => p.visible);

  // Default to 'vienesas' if no visible promos, else 'promos'
  const defaultTab: TabId = visiblePromos.length > 0 ? 'promos' : 'vienesas';

  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [search,    setSearch]    = useState('');
  const tabBarRef = useRef<HTMLDivElement>(null);

  const hasBebidas = items.some(i => i.category === 'bebidas' && i.visible);
  // Hide promos tab if no visible promos; hide bebidas if no bebidas items
  const visibleTabs = TABS.filter(t => {
    if (t.id === 'promos')  return visiblePromos.length > 0;
    if (t.id === 'bebidas') return hasBebidas;
    return true;
  });

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    if (tabBarRef.current) {
      const btn = tabBarRef.current.querySelector(`[data-tab="${id}"]`) as HTMLElement | null;
      if (btn) tabBarRef.current.scrollLeft = btn.offsetLeft - tabBarRef.current.clientWidth / 2 + btn.offsetWidth / 2;
    }
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

    const hasDual = catItems.some(isDual);
    return (
      <div>
        {hasDual && <SizeHint/>}
        <div style={listStyle}>
          {catItems.map(i => isDual(i) ? <DualCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/> : <SimpleCard key={i.id} item={i} aderezos={aderezos} disabledIngredients={disabledIngredients}/>)}
        </div>
      </div>
    );
  };

  // Búsqueda en menú público
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
      <div style={{ position:'sticky', top:52, zIndex:30, background:'rgba(255,249,245,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', padding:'10px 20px' }}>
        {/* Buscador */}
        <div style={{ position:'relative', marginBottom:8 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text-muted)', pointerEvents:'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto o ingrediente…"
            style={{ width:'100%', padding:'8px 32px 8px 34px', borderRadius:999, border:'1px solid var(--border)', background:'var(--card)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted)', lineHeight:1 }}>×</button>
          )}
        </div>

        {/* Tabs — se ocultan mientras hay búsqueda */}
        {!q && (
          <div ref={tabBarRef} style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none', paddingBottom:2 }}>
            {visibleTabs.map(tab => (
              <button key={tab.id} data-tab={tab.id} onClick={() => switchTab(tab.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:999, border: activeTab===tab.id?'2px solid var(--orange)':'2px solid transparent', background: activeTab===tab.id?'var(--orange)':'var(--bg3)', color: activeTab===tab.id?'#fff':'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, whiteSpace:'nowrap', cursor:'pointer', transition:'all .2s', letterSpacing:.5, flexShrink:0 }}>
                <span style={{ fontSize:13 }}>{tab.emoji}</span>{tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!q && <TopItems menuItems={items}/>}

      <div style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'20px 16px 0' }}>
        {q ? (
          /* Resultados de búsqueda */
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
          /* Vista normal por tab */
          <>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <span style={{ fontSize:24 }}>{activeTabData?.emoji}</span>
              <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--text)', letterSpacing:.3, lineHeight:1 }}>{tabLabel}</h2>
            </div>
            {activeTab === 'burrito' && <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14, fontWeight:500 }}>Arma tu Burrito o Bowl personalizado paso a paso</p>}
            {renderContent()}
          </>
        )}
      </div>
    </section>
  );
}
