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
      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:32, color:'var(--ink-900)', margin:'0 0 8px' }}>¿Te gustó la atención?</h2>
      <p style={{ fontSize:14, color:'var(--ink-500)', marginBottom:24 }}>100% opcional, siempre agradecida.</p>
      {sent ? (
        <div style={{ background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:'var(--r-md)', padding:'24px' }}>
          <div style={{ fontSize:32, marginBottom:6 }}>🙏</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:22, color:'#1a8a3e' }}>¡Muchas gracias!</div>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:18, flexWrap:'wrap' }}>
            {amounts.map(a => (
              <button key={a} onClick={() => setSelected(a)} style={{ padding:'10px 18px', borderRadius:'var(--r-pill)', border:`2px solid ${selected===a?'var(--brand-500)':'var(--line)'}`, background: selected===a?'rgba(242,100,25,0.1)':'var(--surface-0)', color: selected===a?'var(--brand-500)':'var(--ink-900)', fontFamily:'var(--font-display)', fontWeight:900, fontSize:17, cursor:'pointer', transition:'all .2s' }}>{fmt(a)}</button>
            ))}
          </div>
          <button onClick={sendTip} disabled={!selected} style={{ display:'inline-flex', alignItems:'center', gap:8, background: selected?'#25D366':'var(--surface-3)', color: selected?'#fff':'var(--ink-500)', padding:'13px 26px', borderRadius:'var(--r-pill)', border:'none', fontFamily:'var(--font-display)', fontWeight:900, fontSize:17, cursor: selected?'pointer':'not-allowed', transition:'all .2s' }}>
            <WAIcon size={17} color={selected?'#fff':'var(--ink-500)'}/> Enviar propina
          </button>
        </div>
      )}
      </div>
    </section>
  );
}
