'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { BURRITO_DATA, fmt } from '@/lib/menuData';

type Proteina = typeof BURRITO_DATA.proteinas[number];

export default function BurritoBuilder() {
  const { addItem, setIsOpen } = useCart();
  const [step,     setStep]     = useState(0);
  const [format,   setFormat]   = useState<'burrito' | 'bowl' | null>(null);
  const [relleno,  setRelleno]  = useState<string | null>(null);
  const [proteina, setProteina] = useState<Proteina | null>(null);
  const [size,     setSize]     = useState<'normal' | 'xl'>('normal');
  const [toppings, setToppings] = useState<string[]>([]);
  const [salsas,   setSalsas]   = useState<string[]>([]);
  const [note,     setNote]     = useState('');
  const [done,     setDone]     = useState(false);

  const steps = ['Formato','Relleno','Proteína','Toppings','Salsas'];

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string, max: number) => {
    if (arr.includes(val)) setArr(arr.filter(x => x !== val));
    else if (arr.length < max) setArr([...arr, val]);
  };

  const canNext = [format !== null, relleno !== null, proteina !== null, true, true];
  const price   = proteina ? (size === 'normal' ? proteina.normal : proteina.xl) : 0;

  const reset = () => {
    setStep(0); setFormat(null); setRelleno(null); setProteina(null);
    setSize('normal'); setToppings([]); setSalsas([]); setNote(''); setDone(false);
  };

  const addToCart = () => {
    const desc = [
      `${format === 'bowl' ? 'Bowl' : 'Burrito'} · ${relleno}`,
      `${proteina!.name} (${size.toUpperCase()})`,
      toppings.length ? `Toppings: ${toppings.join(', ')}` : null,
      salsas.length   ? `Salsas: ${salsas.join(', ')}`     : null,
    ].filter(Boolean).join(' · ');

    addItem({ name:`Burrito Gustoso${format === 'bowl' ? ' (Bowl)' : ''}`, desc, price, note: note.trim() || undefined, alwaysNew:true });
    setIsOpen(true);
    reset();
  };

  if (done) return (
    <div style={{ textAlign:'center', padding:'24px 0' }}>
      <div style={{ fontSize:40, marginBottom:10 }}>🌯</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--orange)', marginBottom:6 }}>¡Listo tu burrito!</div>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px', textAlign:'left', marginBottom:16 }}>
        {[['Formato',format==='bowl'?'Bowl':'Burrito'],['Relleno',relleno],['Proteína',`${proteina?.name} (${size.toUpperCase()})`],['Toppings',toppings.join(', ')||'—'],['Salsas',salsas.join(', ')||'—']].map(([k,v]) => (
          <div key={k} style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}><span style={{ fontWeight:700 }}>{k}:</span> {v}</div>
        ))}
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Nota (opcional)</div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: extra picante, sin jalapeño..." style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:14, fontFamily:'Barlow,sans-serif', outline:'none' }} />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={reset} style={{ flex:1, padding:'12px', borderRadius:999, border:'2px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>← Editar</button>
        <button onClick={addToCart} style={{ flex:2, padding:'12px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          🛒 Agregar {fmt(price)}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom:16 }}>
      <div style={{ display:'flex', gap:4, marginBottom:18 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ width:'100%', height:3, borderRadius:2, background: i <= step ? 'var(--orange)' : 'var(--border)', transition:'background .3s' }}></div>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:.5, color: i <= step ? 'var(--orange)' : 'var(--text-muted)' }}>{s.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:14, color:'var(--text)' }}>¿Burrito o Bowl?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {(['burrito','bowl'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{ background: format===f?'var(--orange)':'var(--card)', border:`2px solid ${format===f?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius)', padding:'20px 16px', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:30 }}>{f==='burrito'?'🌯':'🥣'}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color: format===f?'#fff':'var(--text)', textTransform:'uppercase' }}>{f}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Relleno</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Elige 1</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {BURRITO_DATA.rellenos.map(r => (
              <button key={r} onClick={() => setRelleno(r)} style={{ background: relleno===r?'rgba(242,100,25,0.1)':'var(--card)', border:`2px solid ${relleno===r?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', textAlign:'left', cursor:'pointer', transition:'all .2s', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: relleno===r?'var(--orange)':'var(--text)' }}>{r}</button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Proteína</div>
          <div style={{ display:'flex', gap:8, margin:'8px 0 12px' }}>
            {(['normal','xl'] as const).map(s => (
              <button key={s} onClick={() => setSize(s)} style={{ flex:1, padding:'7px', borderRadius:999, border:`2px solid ${size===s?'var(--orange)':'var(--border)'}`, background: size===s?'rgba(242,100,25,0.1)':'var(--card)', color: size===s?'var(--orange)':'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, cursor:'pointer', textTransform:'uppercase', transition:'all .2s' }}>{s==='xl'?'XL':'Normal'}</button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {BURRITO_DATA.proteinas.map(p => (
              <button key={p.name} onClick={() => setProteina(p)} style={{ background: proteina?.name===p.name?'rgba(242,100,25,0.1)':'var(--card)', border:`2px solid ${proteina?.name===p.name?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', cursor:'pointer', transition:'all .2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: proteina?.name===p.name?'var(--orange)':'var(--text)' }}>{p.name}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--yellow)' }}>{fmt(size==='normal'?p.normal:p.xl)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Toppings</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Hasta 5 — {toppings.length}/5</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {BURRITO_DATA.toppings.map(t => {
              const sel = toppings.includes(t);
              const maxed = !sel && toppings.length >= 5;
              return <button key={t} onClick={() => toggleArr(toppings, setToppings, t, 5)} style={{ padding:'7px 13px', borderRadius:999, border:`2px solid ${sel?'var(--orange)':'var(--border)'}`, background: sel?'var(--orange)':'var(--card)', color: sel?'#fff':maxed?'var(--border)':'var(--text)', fontWeight:600, fontSize:13, cursor: maxed?'not-allowed':'pointer', opacity: maxed?.35:1 }}>{t}</button>;
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Salsas</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Hasta 2 — {salsas.length}/2</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {BURRITO_DATA.salsas.map(s => {
              const sel = salsas.includes(s);
              const maxed = !sel && salsas.length >= 2;
              return <button key={s} onClick={() => toggleArr(salsas, setSalsas, s, 2)} style={{ padding:'7px 13px', borderRadius:999, border:`2px solid ${sel?'var(--yellow)':'var(--border)'}`, background: sel?'rgba(255,214,0,0.12)':'var(--card)', color: sel?'#8a6800':maxed?'var(--border)':'var(--text)', fontWeight:600, fontSize:13, cursor: maxed?'not-allowed':'pointer', opacity: maxed?.35:1 }}>{s}</button>;
            })}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} style={{ flex:1, padding:'11px', borderRadius:999, border:'2px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>← Atrás</button>
          : <div style={{ flex:1 }}></div>
        }
        <button disabled={!canNext[step]} onClick={() => { if (step < 4) setStep(s => s + 1); else setDone(true); }} style={{ flex:2, padding:'11px', borderRadius:999, border:'none', background: canNext[step]?'var(--orange)':'var(--border)', color: canNext[step]?'#fff':'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, cursor: canNext[step]?'pointer':'not-allowed', transition:'all .2s' }}>
          {step === 4 ? 'Revisar pedido →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
