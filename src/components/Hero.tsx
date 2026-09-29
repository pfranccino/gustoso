'use client';

import { useSettings } from '@/contexts/SettingsContext';
import Logo from './Logo';
import { WAIcon } from './icons';
import { MenuItem } from '@/lib/firestore/menuItems';

export default function Hero({ menuItems = [] }: { menuItems?: MenuItem[] }) {
  const { waNumber, isOpen, avgMinutes, openTime, delivery } = useSettings();

  const heroPhoto = menuItems.find(m => m.visible && m.imageUrl);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hola Gustoso's, quiero hacer un pedido 🌭")}`;

  return (
    <section className="hero-section" style={{
      position: 'relative',
      minHeight: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '88px 24px 32px',
      textAlign: 'center',
    }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,100,25,0.12) 0%, transparent 70%)' }}/>
      {/* Mobile decorative circles — hidden on desktop */}
      <div className="hero-bg-circles" style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ position:'absolute', width:280+i*160, height:280+i*160, borderRadius:'50%', border:`1px solid rgba(242,100,25,${0.07-i*0.02})`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}/>
        ))}
      </div>

      {/* Desktop gradient accent */}
      <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(242,100,25,0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 90% 80%, rgba(232,163,11,0.06) 0%, transparent 60%)', pointerEvents:'none' }}/>

      {/* Inner grid — single col on mobile, 2-col on desktop */}
      <div className="hero-inner" style={{ position:'relative', zIndex:1, maxWidth:'var(--max)', width:'100%' }}>

        {/* ── Left / main content ── */}
        <div className="hero-text" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          {/* Logo visible on mobile only */}
          <div className="hero-logo-mobile fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'center' }}>
            <Logo size={64}/>
          </div>

          {/* Status pill */}
          <div className="fade-up hero-status-pill" style={{ display:'inline-flex', alignItems:'center', gap:6, background: isOpen ? 'var(--success-soft)' : 'var(--surface-2)', border:`1px solid ${isOpen ? 'var(--success)' : 'var(--line)'}`, borderRadius:'var(--r-pill)', padding:'5px 11px', marginBottom:8, fontSize:11, fontWeight:700, color: isOpen ? 'var(--success)' : 'var(--ink-500)', letterSpacing:.3, whiteSpace:'nowrap' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background: isOpen ? 'var(--success)' : 'var(--ink-400)', display:'inline-block', boxShadow: isOpen ? '0 0 0 3px var(--success-soft)' : 'none' }}/>
            {isOpen ? `ABIERTO · ${avgMinutes} MIN` : openTime ? `CERRADO · Abre ${openTime}` : 'CERRADO'}
          </div>

          {/* Passive delivery signal */}
          {delivery?.enabled && (
            <div className="fade-up" style={{ fontSize:12, color:'var(--ink-500)', fontWeight:600, marginBottom:16 }}>
              Delivery disponible · ~{avgMinutes} min
            </div>
          )}

          <h1 className="fade-up-2" style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'clamp(44px,10vw,76px)', lineHeight:.95, color:'var(--ink-900)', marginBottom:14, letterSpacing:-1 }}>
            El sabor que<br/><span style={{ color:'var(--brand-500)' }}>te conquista</span>
          </h1>

          <p className="fade-up-3" style={{ fontSize:17, color:'var(--ink-500)', maxWidth:480, margin:'0 auto 8px', fontWeight:500, lineHeight:1.5 }}>
            Vienesas, sándwiches, burritos y más.<br/>Hecho con sabor, entregado con gusto.
          </p>

          {/* Locality line */}
          <div className="fade-up-3" style={{ fontSize:12, fontWeight:700, color:'var(--ink-400)', letterSpacing:2, textTransform:'uppercase', marginBottom:28 }}>
            Desde Los Andes para ti 🌯
          </div>

          <div className="hero-cta fade-up-3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:20 }}>
            <button
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior:'smooth' })}
              style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--brand-500)', color:'#fff', padding:'15px 30px', borderRadius:'var(--r-pill)', border:'none', fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, letterSpacing:.5, cursor:'pointer', boxShadow:'var(--glow-brand)', whiteSpace:'nowrap' }}
            >
              Ver el menú y pedir →
            </button>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#25D366', textDecoration:'none', fontSize:14, fontWeight:700 }}>
              <WAIcon size={16} color="#25D366"/> +56 9 8521 0940
            </a>
          </div>
        </div>

        {/* ── Right / photo — desktop only ── */}
        <div className="hero-collage" style={{ display:'none', position:'relative', height:480, justifyContent:'center', alignItems:'center' }}>
          <div style={{ width:'100%', maxWidth:380, aspectRatio:'4/5', borderRadius:'var(--r-lg)', overflow:'hidden', border:'2px solid var(--line-brand)', boxShadow:'var(--e-3)' }}>
            {heroPhoto?.imageUrl
              ? <img src={heroPhoto.imageUrl} alt={heroPhoto.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                  <span style={{ fontSize:64 }}>🌯</span>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:20, color:'var(--brand-500)' }}>Gustoso&apos;s</span>
                </div>
            }
          </div>
        </div>

      </div>
    </section>
  );
}
