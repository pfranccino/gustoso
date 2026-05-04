'use client';

import { useCart } from '@/contexts/CartContext';
import Logo from './Logo';

export default function Nav({ scrolled }: { scrolled: boolean }) {
  const { count, setIsOpen } = useCart();
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background: scrolled?'rgba(255,249,245,0.95)':'transparent', backdropFilter: scrolled?'blur(12px)':'none', borderBottom: scrolled?'1px solid var(--border)':'none', transition:'all .35s', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <Logo size={24}/>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {([['menu','Menú'],['nosotros','Nosotros'],['contacto','Contacto']] as const).map(([id,label]) => (
          <button key={id} onClick={() => scrollTo(id)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer', padding:'6px 8px', borderRadius:6, transition:'color .2s' }}
            onMouseEnter={e => (e.target as HTMLButtonElement).style.color='var(--text)'}
            onMouseLeave={e => (e.target as HTMLButtonElement).style.color='var(--text-muted)'}
          >{label}</button>
        ))}
        <button onClick={() => setIsOpen(true)} style={{ position:'relative', background:'var(--orange)', color:'#fff', border:'none', borderRadius:999, padding:'7px 14px', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          🛒
          {count > 0 && <span style={{ position:'absolute', top:-6, right:-6, background:'var(--yellow)', color:'#1A0800', width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:11 }}>{count}</span>}
        </button>
      </div>
    </nav>
  );
}
