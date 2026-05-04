'use client';

import { WA_NUMBER } from '@/lib/menuData';
import Logo from './Logo';
import { WAIcon } from './icons';

export default function Hero() {
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hola Gustoso's, quiero hacer un pedido 🌭")}`;

  return (
    <section style={{ position:'relative', minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', overflow:'hidden', padding:'80px 24px 80px', textAlign:'center' }}>
      <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,100,25,0.12) 0%, transparent 70%)' }}></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ position:'absolute', width:280+i*160, height:280+i*160, borderRadius:'50%', border:`1px solid rgba(242,100,25,${0.07-i*0.02})`, top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:0 }}></div>
      ))}
      <div style={{ position:'relative', zIndex:1, maxWidth:'var(--max)', width:'100%' }}>
        <div className="fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'center' }}><Logo size={64}/></div>
        <h1 className="fade-up-2" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(40px,10vw,76px)', lineHeight:.95, color:'var(--text)', marginBottom:14, letterSpacing:-1 }}>
          El sabor que<br/><span style={{ color:'var(--orange)' }}>te conquista</span>
        </h1>
        <p className="fade-up-3" style={{ fontSize:17, color:'var(--text-muted)', maxWidth:360, margin:'0 auto 32px', fontWeight:500, lineHeight:1.5 }}>
          Vienesas, sándwiches, burritos y más.<br/>Hecho con sabor, entregado con gusto.
        </p>
        <div className="fade-up-3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior:'smooth' })} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--orange)', color:'#fff', padding:'15px 30px', borderRadius:999, border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:.5, cursor:'pointer', boxShadow:'0 6px 24px rgba(242,100,25,0.35)' }}>
            Ver carta y pedir 🛒
          </button>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#25D366', textDecoration:'none', fontSize:14, fontWeight:700 }}>
            <WAIcon size={16} color="#25D366"/> Contactar por WhatsApp
          </a>
        </div>
        <div style={{ display:'flex', gap:0, marginTop:48, border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)' }}>
          {[['5+','Años'],['500+','Clientes felices'],['30min','Tiempo promedio']].map(([num, label], i) => (
            <div key={i} style={{ flex:1, padding:'16px 8px', textAlign:'center', borderRight: i<2?'1px solid var(--border)':'none' }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:'var(--orange)' }}>{num}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
