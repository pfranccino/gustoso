'use client';

import { useSettings } from '@/contexts/SettingsContext';
import { WAIcon, LocationIcon, ClockIcon } from './icons';

export default function Contact() {
  const { waNumber, address, schedule } = useSettings();
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hola Gustoso's, quiero hacer un pedido 🌭")}`;
  return (
    <section id="contacto" style={{ background:'var(--bg2)', padding:'60px 0 80px' }}>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Encuéntranos</span>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginTop:6 }}>Cómo llegar</h2>
        </div>
        <div style={{ width:'100%', height:200, background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px solid var(--border)', marginBottom:16, overflow:'hidden' }}>
          <iframe title="Ubicación Gustoso's" src="https://maps.google.com/maps?q=Marino+Jose+Manuel+Ramirez+1641&output=embed&z=15" width="100%" height="100%" style={{ border:'none' }} loading="lazy"></iframe>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {[
            { icon:<LocationIcon size={17}/>, label:'Dirección', value: address,   href: undefined },
            { icon:<ClockIcon size={17}/>,   label:'Horario',   value: schedule,   href: undefined },
            { icon:<WAIcon size={17} color="var(--orange)"/>, label:'WhatsApp', value:`+${waNumber}`, href: waUrl },
          ].map((item, i) => (
            <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ color:'var(--orange)', flexShrink:0, marginTop:2 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>{item.label}</div>
                {item.href
                  ? <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ fontSize:14, fontWeight:600, color:'#25D366', textDecoration:'none' }}>{item.value}</a>
                  : <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{item.value}</div>
                }
              </div>
            </div>
          ))}
        </div>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#25D366', color:'#fff', padding:'15px 24px', borderRadius:999, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:19, letterSpacing:.5, textDecoration:'none', boxShadow:'0 6px 20px rgba(37,211,102,0.25)' }}>
          <WAIcon size={20} color="#fff"/> Hacer pedido ahora
        </a>
      </div>
    </section>
  );
}
