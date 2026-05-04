'use client';

import { useRef, useState } from 'react';
import { MENU_DATA } from '@/lib/menuData';
import SimpleCard from './SimpleCard';
import DualCard from './DualCard';
import SectionHeader from './SectionHeader';
import BurritoBuilder from './BurritoBuilder';

const TABS = [
  { id:'vienesas',  label:'Vienesas',    emoji:'🌭' },
  { id:'as',        label:'AS',          emoji:'🥪' },
  { id:'churrasco', label:'Churrasco',   emoji:'🥩' },
  { id:'mechada',   label:'Mechada',     emoji:'🥖' },
  { id:'burrito',   label:'Burrito',     emoji:'🌯' },
  { id:'papas',     label:'Papas & Más', emoji:'🍟' },
] as const;

type TabId = typeof TABS[number]['id'];

function SizeHint() {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:12, padding:'8px 12px', background:'var(--bg2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>Toca <strong style={{ color:'var(--orange)' }}>+</strong> para elegir tamaño y agregar al carrito</span>
    </div>
  );
}

export default function MenuSection() {
  const [activeTab, setActiveTab] = useState<TabId>('vienesas');
  const tabBarRef = useRef<HTMLDivElement>(null);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    if (tabBarRef.current) {
      const btn = tabBarRef.current.querySelector(`[data-tab="${id}"]`) as HTMLElement | null;
      if (btn) tabBarRef.current.scrollLeft = btn.offsetLeft - tabBarRef.current.clientWidth / 2 + btn.offsetWidth / 2;
    }
  };

  const activeTabData = TABS.find(t => t.id === activeTab);
  const tabLabel = activeTab==='churrasco'?'Sándwich Churrasco':activeTab==='mechada'?'Sándwich Mechada':activeTab==='burrito'?'Burrito Gustoso':activeTab==='papas'?'Papas & Más':activeTabData?.label;

  const listStyle: React.CSSProperties = { display:'flex', flexDirection:'column', gap:10 };

  const renderContent = () => {
    switch (activeTab) {
      case 'vienesas':  return <div style={listStyle}>{MENU_DATA.vienesas.items.map(i => <SimpleCard key={i.name} item={i}/>)}</div>;
      case 'as':        return <div style={listStyle}>{MENU_DATA.as.items.map(i => <SimpleCard key={i.name} item={i}/>)}</div>;
      case 'churrasco': return <div><SizeHint/><div style={listStyle}>{MENU_DATA.churrasco.items.map(i => <DualCard key={i.name} item={i}/>)}</div></div>;
      case 'mechada':   return <div><SizeHint/><div style={listStyle}>{MENU_DATA.mechada.items.map(i => <DualCard key={i.name} item={i}/>)}</div></div>;
      case 'burrito':   return <BurritoBuilder/>;
      case 'papas':     return <div>{MENU_DATA.papas.groups.map(g => <div key={g.name}><SectionHeader title={g.name}/><div style={listStyle}>{g.items.map(i => <SimpleCard key={i.name} item={i}/>)}</div></div>)}</div>;
    }
  };

  return (
    <section id="menu" style={{ paddingBottom:100 }}>
      <div style={{ position:'sticky', top:52, zIndex:30, background:'rgba(255,249,245,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', padding:'10px 20px' }}>
        <div ref={tabBarRef} style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', msOverflowStyle:'none', paddingBottom:2 }}>
          {TABS.map(tab => (
            <button key={tab.id} data-tab={tab.id} onClick={() => switchTab(tab.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:999, border: activeTab===tab.id?'2px solid var(--orange)':'2px solid transparent', background: activeTab===tab.id?'var(--orange)':'var(--bg3)', color: activeTab===tab.id?'#fff':'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, whiteSpace:'nowrap', cursor:'pointer', transition:'all .2s', letterSpacing:.5, flexShrink:0 }}>
              <span style={{ fontSize:13 }}>{tab.emoji}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'20px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:24 }}>{activeTabData?.emoji}</span>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--text)', letterSpacing:.3, lineHeight:1 }}>{tabLabel}</h2>
        </div>
        {activeTab === 'burrito' && <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:14, fontWeight:500 }}>Arma tu Burrito o Bowl personalizado paso a paso</p>}
        {renderContent()}
      </div>
    </section>
  );
}
