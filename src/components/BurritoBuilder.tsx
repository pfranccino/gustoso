'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { fmt } from '@/lib/menuData';
import { BurritoConfig, BurritoItem, BurritoProtein } from '@/lib/firestore/burritoConfig';

export default function BurritoBuilder({ config }: { config: BurritoConfig }) {
  const { addItem, setIsOpen } = useCart();
  const [step,     setStep]     = useState(0);
  const [format,   setFormat]   = useState<'burrito' | 'bowl' | null>(null);
  const [relleno,  setRelleno]  = useState<BurritoItem | null>(null);
  const [proteina, setProteina] = useState<BurritoProtein | null>(null);
  const [size,     setSize]     = useState<'normal' | 'xl'>('normal');
  const [toppings,    setToppings]    = useState<BurritoItem[]>([]);
  const [salsas,      setSalsas]      = useState<BurritoItem[]>([]);
  const [adicionales, setAdicionales] = useState<BurritoItem[]>([]);
  const [note,        setNote]        = useState('');
  const [done,        setDone]        = useState(false);

  // Solo mostrar ítems visibles
  const visRellenos    = config.rellenos.filter(r => r.visible);
  const visProteinas   = config.proteinas.filter(p => p.visible);
  const visToppings    = config.toppings.filter(t => t.visible);
  const visSalsas      = config.salsas.filter(s => s.visible);
  const visAdicionales = (config.adicionales ?? []).filter(a => a.visible);

  // Incluir paso Adicionales solo si hay al menos uno configurado
  const steps = visAdicionales.length > 0
    ? ['Formato', 'Relleno', 'Proteína', 'Toppings', 'Salsas', 'Adicionales']
    : ['Formato', 'Relleno', 'Proteína', 'Toppings', 'Salsas'];
  const lastStep = steps.length - 1;

  const toggleArr = <T extends BurritoItem>(arr: T[], setArr: (v: T[]) => void, val: T, max: number) => {
    if (arr.some(x => x.name === val.name)) setArr(arr.filter(x => x.name !== val.name));
    else if (arr.length < max) setArr([...arr, val]);
  };

  const canNext  = [format !== null, relleno !== null, proteina !== null, true, true, true];
  const basePrice   = proteina ? (size === 'normal' ? proteina.normal : proteina.xl) : 0;
  const extrasPrice = [...toppings, ...salsas, ...adicionales].reduce((s, i) => s + i.price, 0);
  const price = basePrice + extrasPrice;

  const reset = () => {
    setStep(0); setFormat(null); setRelleno(null); setProteina(null);
    setSize('normal'); setToppings([]); setSalsas([]); setAdicionales([]); setNote(''); setDone(false);
  };

  const addToCart = () => {
    const extrasList = [...toppings, ...salsas, ...adicionales].filter(i => i.price > 0);
    const desc = [
      `${format === 'bowl' ? 'Bowl' : 'Burrito'} · ${relleno!.name}`,
      `${proteina!.name} (${size.toUpperCase()})`,
      toppings.length ? `Toppings: ${toppings.map(t => t.price > 0 ? `${t.name} (+${fmt(t.price)})` : t.name).join(', ')}` : null,
      salsas.length   ? `Salsas: ${salsas.map(s => s.price > 0 ? `${s.name} (+${fmt(s.price)})` : s.name).join(', ')}`     : null,
    ].filter(Boolean).join(' · ');

    addItem({
      name:      `Burrito Gustoso${format === 'bowl' ? ' (Bowl)' : ''}`,
      desc,
      price,
      extras:    extrasList.length > 0 ? extrasList : undefined,
      note:      note.trim() || undefined,
      alwaysNew: true,
    });
    setIsOpen(true);
    reset();
  };

  /* ── done screen ─────────────────────────────────────────── */

  if (done) return (
    <div style={{ textAlign:'center', padding:'24px 0' }}>
      <div style={{ fontSize:40, marginBottom:10 }}>🌯</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--orange)', marginBottom:6 }}>¡Listo tu burrito!</div>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px', textAlign:'left', marginBottom:16 }}>
        {[
          ['Formato',  format==='bowl' ? 'Bowl' : 'Burrito'],
          ['Relleno',  relleno?.name],
          ['Proteína', `${proteina?.name} (${size.toUpperCase()}) — ${fmt(basePrice)}`],
          ['Toppings',    toppings.length    ? toppings.map(t => t.price > 0 ? `${t.name} (+${fmt(t.price)})` : t.name).join(', ')       : '—'],
          ['Salsas',      salsas.length      ? salsas.map(s => s.price > 0 ? `${s.name} (+${fmt(s.price)})` : s.name).join(', ')         : '—'],
          ...(adicionales.length ? [['Adicionales', adicionales.map(a => `${a.name} (+${fmt(a.price)})`).join(', ')]] : []),
        ].map(([k, v]) => (
          <div key={k} style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
            <span style={{ fontWeight:700 }}>{k}:</span> {v}
          </div>
        ))}
        {extrasPrice > 0 && (
          <div style={{ fontSize:12, color:'var(--orange)', fontWeight:600, marginTop:8 }}>
            ➕ Extras: +{fmt(extrasPrice)}
          </div>
        )}
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Nota (opcional)</div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: extra picante, sin jalapeño..."
          style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:14, fontFamily:'Barlow,sans-serif', outline:'none' }} />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={reset}
          style={{ flex:1, padding:'12px', borderRadius:999, border:'2px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>
          ← Editar
        </button>
        <button onClick={addToCart}
          style={{ flex:2, padding:'12px', borderRadius:999, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          🛒 Agregar {fmt(price)}
        </button>
      </div>
    </div>
  );

  /* ── stepper ─────────────────────────────────────────────── */

  return (
    <div style={{ paddingBottom:16 }}>
      {/* Progress */}
      <div style={{ display:'flex', gap:4, marginBottom:18 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ width:'100%', height:3, borderRadius:2, background: i <= step ? 'var(--orange)' : 'var(--border)', transition:'background .3s' }}/>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:.5, color: i <= step ? 'var(--orange)' : 'var(--text-muted)' }}>{s.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Step 0 — Formato */}
      {step === 0 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:14, color:'var(--text)' }}>¿Burrito o Bowl?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {(['burrito','bowl'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ background: format===f?'var(--orange)':'var(--card)', border:`2px solid ${format===f?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius)', padding:'20px 16px', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:30 }}>{f==='burrito'?'🌯':'🥣'}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color: format===f?'#fff':'var(--text)', textTransform:'uppercase' }}>{f}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Relleno */}
      {step === 1 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Relleno</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Elige 1</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {visRellenos.map(r => (
              <button key={r.name} onClick={() => setRelleno(r)}
                style={{ background: relleno?.name===r.name?'rgba(242,100,25,0.1)':'var(--card)', border:`2px solid ${relleno?.name===r.name?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', textAlign:'left', cursor:'pointer', transition:'all .2s', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: relleno?.name===r.name?'var(--orange)':'var(--text)' }}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Proteína */}
      {step === 2 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Proteína</div>
          <div style={{ display:'flex', gap:8, margin:'8px 0 12px' }}>
            {(['normal','xl'] as const).map(s => (
              <button key={s} onClick={() => setSize(s)}
                style={{ flex:1, padding:'7px', borderRadius:999, border:`2px solid ${size===s?'var(--orange)':'var(--border)'}`, background: size===s?'rgba(242,100,25,0.1)':'var(--card)', color: size===s?'var(--orange)':'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, cursor:'pointer', textTransform:'uppercase', transition:'all .2s' }}>
                {s==='xl'?'XL':'Normal'}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {visProteinas.map(p => (
              <button key={p.name} onClick={() => setProteina(p)}
                style={{ background: proteina?.name===p.name?'rgba(242,100,25,0.1)':'var(--card)', border:`2px solid ${proteina?.name===p.name?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', cursor:'pointer', transition:'all .2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: proteina?.name===p.name?'var(--orange)':'var(--text)' }}>{p.name}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--yellow)' }}>{fmt(size==='normal'?p.normal:p.xl)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Toppings */}
      {step === 3 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Toppings</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Hasta 5 — {toppings.length}/5</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {visToppings.map(t => {
              const sel    = toppings.some(x => x.name === t.name);
              const maxed  = !sel && toppings.length >= 5;
              return (
                <button key={t.name} onClick={() => !maxed && toggleArr(toppings, setToppings, t, 5)}
                  style={{ padding:'7px 13px', borderRadius:999, border:`2px solid ${sel?'var(--orange)':'var(--border)'}`, background: sel?'var(--orange)':'var(--card)', color: sel?'#fff':maxed?'var(--border)':'var(--text)', fontWeight:600, fontSize:13, cursor: maxed?'not-allowed':'pointer', opacity: maxed?.35:1, display:'flex', alignItems:'center', gap:5 }}>
                  {t.name}
                  {t.price > 0 && <span style={{ fontSize:11, color: sel?'rgba(255,255,255,0.8)':'var(--orange)', fontWeight:700 }}>+{fmt(t.price)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4 — Salsas */}
      {step === 4 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Salsas</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Hasta 2 — {salsas.length}/2</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {visSalsas.map(s => {
              const sel    = salsas.some(x => x.name === s.name);
              const maxed  = !sel && salsas.length >= 2;
              return (
                <button key={s.name} onClick={() => !maxed && toggleArr(salsas, setSalsas, s, 2)}
                  style={{ padding:'7px 13px', borderRadius:999, border:`2px solid ${sel?'var(--yellow)':'var(--border)'}`, background: sel?'rgba(255,214,0,0.12)':'var(--card)', color: sel?'#8a6800':maxed?'var(--border)':'var(--text)', fontWeight:600, fontSize:13, cursor: maxed?'not-allowed':'pointer', opacity: maxed?.35:1, display:'flex', alignItems:'center', gap:5 }}>
                  {s.name}
                  {s.price > 0 && <span style={{ fontSize:11, color:'var(--orange)', fontWeight:700 }}>+{fmt(s.price)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav buttons */}
      {/* Step 5 — Adicionales (solo si hay configurados) */}
      {step === 5 && visAdicionales.length > 0 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--text)' }}>Adicionales</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>Extras opcionales con costo adicional</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {visAdicionales.map(a => {
              const sel = adicionales.some(x => x.name === a.name);
              return (
                <button key={a.name} onClick={() => toggleArr(adicionales, setAdicionales, a, 99)}
                  style={{ background: sel?'rgba(242,100,25,0.1)':'var(--card)', border:`2px solid ${sel?'var(--orange)':'var(--border)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', cursor:'pointer', transition:'all .2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: sel?'var(--orange)':'var(--text)' }}>{a.name}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--yellow)' }}>+{fmt(a.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)}
              style={{ flex:1, padding:'11px', borderRadius:999, border:'2px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>← Atrás</button>
          : <div style={{ flex:1 }}/>
        }
        <button disabled={!canNext[step]}
          onClick={() => { if (step < lastStep) setStep(s => s + 1); else setDone(true); }}
          style={{ flex:2, padding:'11px', borderRadius:999, border:'none', background: canNext[step]?'var(--orange)':'var(--border)', color: canNext[step]?'#fff':'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, cursor: canNext[step]?'pointer':'not-allowed', transition:'all .2s' }}>
          {step === lastStep ? 'Revisar pedido →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
