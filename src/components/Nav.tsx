'use client';

import { useCart } from '@/contexts/CartContext';
import Logo from './Logo';

export default function Nav({ scrolled }: { scrolled: boolean }) {
  const { count, total, setIsOpen } = useCart();
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

  return (
    <nav className="nav-inner" style={{
      position: 'fixed', top:0, left:0, right:0, zIndex:100,
      background: scrolled ? 'color-mix(in srgb, var(--surface-0) 92%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--line)' : 'none',
      transition: 'all .35s',
      padding: '12px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
        <Logo size={24}/>
        {/* Desktop nav links — hidden on mobile */}
        <div className="nav-desktop-links" style={{ display:'none', gap:2, alignItems:'center' }}>
          {([['menu','Menú'],['nosotros','Nosotros'],['contacto','Contacto']] as const).map(([id,label]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background:'transparent', border:'none', color:'var(--ink-500)', fontSize:14, fontWeight:600, cursor:'pointer', padding:'7px 12px', borderRadius:'var(--r-sm)', transition:'color .2s' }}
              onMouseEnter={e => (e.target as HTMLButtonElement).style.color='var(--ink-900)'}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.color='var(--ink-500)'}
            >{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{ position:'relative', background:'var(--brand-500)', color:'#fff', border:'none', borderRadius:'var(--r-pill)', padding:'8px 16px', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow: count > 0 ? 'var(--glow-brand)' : 'none', transition:'box-shadow .2s' }}
        >
          🛒
          {/* Show item count always; show total on desktop if items present */}
          {count > 0 && (
            <>
              <span className="nav-cart-label" style={{ display:'none', fontFamily:'var(--font-display)', fontWeight:900, fontSize:14 }}>
                {count} {count === 1 ? 'item' : 'items'} · {fmt(total)}
              </span>
              <span style={{ position:'absolute', top:-6, right:-6, background:'var(--yellow)', color:'var(--ink-900)', width:18, height:18, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:900, fontSize:11 }}>{count}</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
