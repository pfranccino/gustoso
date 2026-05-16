'use client';

import { useState } from 'react';
import { fmt } from '@/lib/menuData';
import { useSettings } from '@/contexts/SettingsContext';
import { WAIcon } from './icons';

export default function TipSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const { waNumber } = useSettings();
  const amounts = [500, 1000, 2000, 5000];

  const sendTip = () => {
    if (!selected) return;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola Gustoso's! Quiero dejar una propina de ${fmt(selected)} 🙏 ¿Cómo les transfiero?`)}`, '_blank');
    setSent(true);
  };

  return (
    <section className="tip-section" style={{ padding:'60px 20px', maxWidth:'var(--max)', margin:'0 auto', textAlign:'center' }}>
      <div className="tip-section-card">
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Propina</span>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', margin:'8px 0 8px' }}>¿Te gustó la atención?</h2>
      <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>100% opcional, siempre agradecida.</p>
      {sent ? (
        <div style={{ background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:'var(--radius)', padding:'24px' }}>
          <div style={{ fontSize:32, marginBottom:6 }}>🙏</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'#1a8a3e' }}>¡Muchas gracias!</div>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:18, flexWrap:'wrap' }}>
            {amounts.map(a => (
              <button key={a} onClick={() => setSelected(a)} style={{ padding:'10px 18px', borderRadius:999, border:`2px solid ${selected===a?'var(--orange)':'var(--border)'}`, background: selected===a?'rgba(242,100,25,0.1)':'var(--card)', color: selected===a?'var(--orange)':'var(--text)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, cursor:'pointer', transition:'all .2s' }}>{fmt(a)}</button>
            ))}
          </div>
          <button onClick={sendTip} disabled={!selected} style={{ display:'inline-flex', alignItems:'center', gap:8, background: selected?'#25D366':'var(--bg3)', color: selected?'#fff':'var(--text-muted)', padding:'13px 26px', borderRadius:999, border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, cursor: selected?'pointer':'not-allowed', transition:'all .2s' }}>
            <WAIcon size={17} color={selected?'#fff':'var(--text-muted)'}/> Enviar propina
          </button>
        </div>
      )}
      </div>
    </section>
  );
}
