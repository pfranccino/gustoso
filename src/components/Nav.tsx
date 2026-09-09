'use client';

import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import Logo from './Logo';
import { WAIcon } from './icons';

export default function Nav({ scrolled }: { scrolled: boolean }) {
  const { count, total, setIsOpen } = useCart();
  const { waNumber, isOpen } = useSettings();
  const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hola Gustoso's, quiero hacer un pedido 🌭")}`;

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

      {/* ── Zona izquierda ── */}
      <div className="nav-zone-left" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <Logo size={24}/>
        <div className="nav-status-pill" style={{ display:'none', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:999, background: isOpen ? 'rgba(21,128,61,0.12)' : 'rgba(160,84,26,0.12)', border: `1px solid ${isOpen ? 'rgba(21,128,61,0.3)' : 'rgba(160,84,26,0.3)'}` }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: isOpen ? 'var(--green)' : 'var(--text-muted)', flexShrink:0, display:'block' }}/>
          <span style={{ fontSize:11, fontWeight:700, color: isOpen ? 'var(--green)' : 'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>{isOpen ? 'Abierto' : 'Cerrado'}</span>
        </div>
      </div>

      {/* ── Zona central — desktop only ── */}
      <div className="nav-zone-center" style={{ display:'none', alignItems:'center', gap:4 }}>
        <div className="nav-desktop-links" style={{ display:'flex', gap:2, alignItems:'center' }}>
          {([['menu','Menú'],['nosotros','Nosotros'],['contacto','Contacto']] as const).map(([id,label]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background:'transparent', border:'none', color:'var(--ink-500)', fontSize:14, fontWeight:600, cursor:'pointer', padding:'7px 12px', borderRadius:'var(--r-sm)', transition:'color .2s' }}
              onMouseEnter={e => (e.target as HTMLButtonElement).style.color='var(--ink-900)'}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.color='var(--ink-500)'}
            >{label}</button>
          ))}
        </div>
        <button
          onClick={() => scrollTo('menu')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text-muted)', fontSize:13, fontFamily:"'Barlow',sans-serif", cursor:'pointer' }}
        >
          🔍 <span style={{ fontSize:13 }}>Buscar…</span>
        </button>
      </div>

      {/* ── Zona derecha ── */}
      <div className="nav-zone-right" style={{ display:'flex', gap:8, alignItems:'center' }}>
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="nav-wa-btn"
          style={{ display:'none', alignItems:'center', gap:6, background:'#25D366', color:'#fff', padding:'7px 14px', borderRadius:999, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, textDecoration:'none', letterSpacing:.3 }}
        >
          <WAIcon size={15} color="#fff"/> Pedir por WA
        </a>
        <button
          onClick={() => setIsOpen(true)}
          style={{ position:'relative', background:'var(--brand-500)', color:'#fff', border:'none', borderRadius:'var(--r-pill)', padding:'8px 16px', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow: count > 0 ? 'var(--glow-brand)' : 'none', transition:'box-shadow .2s' }}
        >
          🛒
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
