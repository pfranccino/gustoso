'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Beef, Soup, Plus, Drumstick } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { fmt } from '@/lib/menuData';
import { BurritoConfig, BurritoItem, BurritoProtein } from '@/lib/firestore/burritoConfig';

export default function BurritoBuilder({ config }: { config: BurritoConfig }) {
  const { addItem, setIsOpen } = useCart();
  const [step,          setStep]          = useState(0);
  const [format,        setFormat]        = useState<'burrito' | 'bowl' | null>(null);
  const [relleno,       setRelleno]       = useState<BurritoItem | null>(null);
  const [proteina,      setProteina]      = useState<BurritoProtein | null>(null);
  const [size,          setSize]          = useState<'normal' | 'xl'>('normal');
  const [toppings,      setToppings]      = useState<BurritoItem[]>([]);
  const [salsas,        setSalsas]        = useState<BurritoItem[]>([]);
  const [adicionales,   setAdicionales]   = useState<BurritoItem[]>([]);
  // null = sin extra proteína, BurritoProtein = la proteína elegida como extra
  const [extraProteina, setExtraProteina] = useState<BurritoProtein | null>(null);
  const [note,          setNote]          = useState('');
  const [done,          setDone]          = useState(false);

  // Solo ítems visibles
  const visRellenos    = config.rellenos.filter(r => r.visible);
  const visProteinas   = config.proteinas.filter(p => p.visible);
  const visToppings    = config.toppings.filter(t => t.visible);
  const visSalsas      = config.salsas.filter(s => s.visible);
  const visAdicionales = (config.adicionales ?? []).filter(a => a.visible);

  // Límites
  const tMax  = config.toppingsMax        ?? 5;
  const tLib  = config.toppingsLibres     ?? 5;
  const tXtra = config.toppingExtraPrecio ?? 0;
  const sMax  = config.salsasMax          ?? 5;
  const sLib  = config.salsasLibres       ?? 2;
  const sXtra = config.salsaExtraPrecio   ?? 0;

  // Pasos dinámicos
  const steps = visAdicionales.length > 0
    ? ['Formato', 'Relleno', 'Proteína', 'Toppings', 'Salsas', 'Adicionales']
    : ['Formato', 'Relleno', 'Proteína', 'Toppings', 'Salsas'];
  const lastStep = steps.length - 1;

  const toggleArr = <T extends BurritoItem>(arr: T[], setArr: (v: T[]) => void, val: T, max: number) => {
    if (arr.some(x => x.name === val.name)) setArr(arr.filter(x => x.name !== val.name));
    else if (arr.length < max) setArr([...arr, val]);
  };

  const canNext = [format !== null, relleno !== null, proteina !== null, true, true, true];

  // Precios
  const toppingsExtraQty  = Math.max(0, toppings.length - tLib);
  const salsasExtraQty    = Math.max(0, salsas.length   - sLib);
  const toppingsExtraCost = toppingsExtraQty * tXtra;
  const salsasExtraCost   = salsasExtraQty   * sXtra;
  const adicionalesCost   = adicionales.reduce((s, i) => s + i.price, 0);

  // Precio de la proteína extra = precio plano configurado por admin (independiente de cuál elijan)
  const extraProteinaPrecio = extraProteina
    ? (size === 'normal' ? (config.proteinaExtraPrecioNormal ?? 0) : (config.proteinaExtraPrecioXL ?? 0))
    : 0;

  const basePrice   = proteina ? (size === 'normal' ? proteina.normal : proteina.xl) : 0;
  const extrasPrice = toppingsExtraCost + salsasExtraCost + adicionalesCost + extraProteinaPrecio;
  const price       = basePrice + extrasPrice;

  const reset = () => {
    setStep(0); setFormat(null); setRelleno(null); setProteina(null);
    setSize('normal'); setToppings([]); setSalsas([]); setAdicionales([]);
    setExtraProteina(null); setNote(''); setDone(false);
  };

  const addToCart = () => {
    const extrasList = [
      ...(extraProteina && extraProteinaPrecio > 0
        ? [{ name: `Extra proteína: ${extraProteina.name}`, price: extraProteinaPrecio }]
        : []),
      ...(toppingsExtraQty > 0 && tXtra > 0
        ? [{ name: `${toppingsExtraQty} topping${toppingsExtraQty > 1 ? 's' : ''} extra`, price: toppingsExtraCost }]
        : []),
      ...(salsasExtraQty > 0 && sXtra > 0
        ? [{ name: `${salsasExtraQty} salsa${salsasExtraQty > 1 ? 's' : ''} extra`, price: salsasExtraCost }]
        : []),
      ...adicionales.filter(a => a.price > 0),
    ];
    const desc = [
      `${format === 'bowl' ? 'Bowl' : 'Burrito'} · ${relleno!.name}`,
      `${proteina!.name} (${size.toUpperCase()})`,
      extraProteina ? `+ Extra: ${extraProteina.name}` : null,
      toppings.length ? `Toppings: ${toppings.map(t => t.name).join(', ')}` : null,
      salsas.length   ? `Salsas: ${salsas.map(s => s.name).join(', ')}`     : null,
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

  /* ── LimitBadge ───────────────────────────────────────────────── */

  function LimitBadge({ selected, libre, max, xtraPrecio, label }: {
    selected: number; libre: number; max: number; xtraPrecio: number; label: string;
  }) {
    const extras = Math.max(0, selected - libre);
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        <span style={{ fontSize:12, color:'var(--ink-500)', fontWeight:600 }}>
          {selected}/{max} {label}
        </span>
        {xtraPrecio > 0 && libre > 0 && (
          <span style={{ fontSize:11, background:'var(--brand-soft)', color:'var(--ink-500)', padding:'3px 8px', borderRadius:999, fontWeight:700 }}>
            {libre} gratis · +{fmt(xtraPrecio)} c/u extra
          </span>
        )}
        {extras > 0 && xtraPrecio > 0 && (
          <span style={{ fontSize:11, background:'var(--brand-soft)', color:'var(--brand)', padding:'3px 8px', borderRadius:999, fontWeight:800 }}>
            +{fmt(extras * xtraPrecio)} extra
          </span>
        )}
      </div>
    );
  }

  /* ── done screen ─────────────────────────────────────────────── */

  if (done) return (
    <div style={{ textAlign:'center', padding:'24px 0' }}>
      <div style={{ marginBottom:10 }}><Beef size={40} style={{color:'var(--brand)'}}/></div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--brand)', marginBottom:6 }}>¡Listo tu burrito!</div>
      <div style={{ background:'var(--surface-sunken)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'16px', textAlign:'left', marginBottom:16 }}>
        {[
          ['Formato',  format === 'bowl' ? 'Bowl' : 'Burrito'],
          ['Relleno',  relleno?.name],
          ['Proteína', `${proteina?.name} (${size.toUpperCase()}) — ${fmt(basePrice)}`],
          ...(extraProteina
            ? [['Extra proteína', `${extraProteina.name}${extraProteinaPrecio > 0 ? ` +${fmt(extraProteinaPrecio)}` : ' (incluida)'}`]]
            : []),
          ['Toppings', toppings.length ? toppings.map(t => t.name).join(', ') : '—'],
          ['Salsas',   salsas.length   ? salsas.map(s => s.name).join(', ')   : '—'],
          ...(adicionales.length ? [['Adicionales', adicionales.map(a => `${a.name} (+${fmt(a.price)})`).join(', ')]] : []),
        ].map(([k, v]) => (
          <div key={k} style={{ fontSize:13, color:'var(--ink-500)', marginBottom:4 }}>
            <span style={{ fontWeight:700 }}>{k}:</span> {v}
          </div>
        ))}
        {toppingsExtraQty > 0 && tXtra > 0 && (
          <div style={{ fontSize:12, color:'var(--brand)', fontWeight:600, marginTop:6 }}>
            <Plus size={12} style={{display:'inline', verticalAlign:'middle'}}/> {toppingsExtraQty} topping{toppingsExtraQty > 1 ? 's' : ''} extra: +{fmt(toppingsExtraCost)}
          </div>
        )}
        {salsasExtraQty > 0 && sXtra > 0 && (
          <div style={{ fontSize:12, color:'var(--brand)', fontWeight:600, marginTop:4 }}>
            <Plus size={12} style={{display:'inline', verticalAlign:'middle'}}/> {salsasExtraQty} salsa{salsasExtraQty > 1 ? 's' : ''} extra: +{fmt(salsasExtraCost)}
          </div>
        )}
        {adicionalesCost > 0 && (
          <div style={{ fontSize:12, color:'var(--brand)', fontWeight:600, marginTop:4 }}>
            <Plus size={12} style={{display:'inline', verticalAlign:'middle'}}/> Adicionales: +{fmt(adicionalesCost)}
          </div>
        )}
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-500)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Nota (opcional)</div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: extra picante, sin jalapeño..."
          style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--radius-sm)', border:'1px solid var(--line)', background:'var(--surface-sunken)', color:'var(--ink-900)', fontSize:14, fontFamily:'Barlow,sans-serif', outline:'none' }} />
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={reset}
          style={{ flex:1, padding:'12px', borderRadius:999, border:'2px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>
          ← Editar
        </button>
        <button onClick={addToCart}
          style={{ flex:2, padding:'12px', borderRadius:999, border:'none', background:'var(--brand-strong)', color:'var(--on-brand)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <ShoppingCart size={18}/> Agregar {fmt(price)}
        </button>
      </div>
    </div>
  );

  /* ── stepper ─────────────────────────────────────────────────── */

  return (
    <div style={{ paddingBottom:16 }}>
      {/* Progress */}
      <div style={{ display:'flex', gap:4, marginBottom:18 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ width:'100%', height:3, borderRadius:2, background: i <= step ? 'var(--brand)' : 'var(--line)', transition:'background .3s' }}/>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:.5, color: i <= step ? 'var(--brand)' : 'var(--ink-500)' }}>{s.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Step 0 — Formato */}
      {step === 0 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:14, color:'var(--ink-900)' }}>¿Burrito o Bowl?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {(['burrito','bowl'] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ background: format===f?'var(--brand)':'var(--surface-raised)', border:`2px solid ${format===f?'var(--brand)':'var(--line)'}`, borderRadius:'var(--radius-lg)', padding:'20px 16px', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                {f==='burrito' ? <Beef size={30} style={{color:'var(--brand)'}}/> : <Soup size={30} style={{color:'var(--brand)'}}/>}
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color: format===f?'#fff':'var(--ink-900)', textTransform:'uppercase' }}>{f}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Relleno */}
      {step === 1 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--ink-900)' }}>Relleno</div>
          <div style={{ fontSize:12, color:'var(--ink-500)', marginBottom:12 }}>Elige 1</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {visRellenos.map(r => (
              <button key={r.name} onClick={() => setRelleno(r)}
                style={{ background: relleno?.name===r.name?'var(--brand-soft)':'var(--surface-raised)', border:`2px solid ${relleno?.name===r.name?'var(--brand)':'var(--line)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', textAlign:'left', cursor:'pointer', transition:'all .2s', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: relleno?.name===r.name?'var(--brand)':'var(--ink-900)' }}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Proteína */}
      {step === 2 && (() => {
        const xPrecio = size === 'normal'
          ? (config.proteinaExtraPrecioNormal ?? 0)
          : (config.proteinaExtraPrecioXL     ?? 0);
        const showExtra = config.proteinaExtraHabilitada && proteina && xPrecio > 0;

        return (
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--ink-900)' }}>Proteína</div>

            {/* Tamaño */}
            <div style={{ display:'flex', gap:8, margin:'8px 0 12px' }}>
              {(['normal','xl'] as const).map(s => (
                <button key={s} onClick={() => { setSize(s); setExtraProteina(null); }}
                  style={{ flex:1, padding:'7px', borderRadius:999, border:`2px solid ${size===s?'var(--brand)':'var(--line)'}`, background: size===s?'var(--brand-soft)':'var(--surface-raised)', color: size===s?'var(--brand)':'var(--ink-500)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, cursor:'pointer', textTransform:'uppercase', transition:'all .2s' }}>
                  {s==='xl'?'XL':'Normal'}
                </button>
              ))}
            </div>

            {/* Lista principal */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {visProteinas.map(p => (
                <button key={p.name} onClick={() => setProteina(p)}
                  style={{ background: proteina?.name===p.name?'var(--brand-soft)':'var(--surface-raised)', border:`2px solid ${proteina?.name===p.name?'var(--brand)':'var(--line)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', cursor:'pointer', transition:'all .2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: proteina?.name===p.name?'var(--brand)':'var(--ink-900)' }}>{p.name}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, color:'var(--gold)' }}>{fmt(size==='normal'?p.normal:p.xl)}</span>
                </button>
              ))}
            </div>

            {/* Extra proteína — selección libre */}
            {showExtra && (
              <div style={{ marginTop:16, borderTop:'1px solid var(--line)', paddingTop:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--ink-900)' }}>
                      <Drumstick size={14} style={{display:'inline', verticalAlign:'middle'}}/> Agregar proteína extra
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-500)', marginTop:2 }}>
                      Puede ser la misma u otra · +{fmt(xPrecio)} c/u
                    </div>
                  </div>
                  {extraProteina && (
                    <button onClick={() => setExtraProteina(null)}
                      style={{ fontSize:12, color:'#dc2626', background:'transparent', border:'1px solid rgba(220,38,38,0.3)', borderRadius:999, padding:'3px 10px', cursor:'pointer', fontWeight:700 }}>
                      Quitar
                    </button>
                  )}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {visProteinas.map(p => {
                    const sel = extraProteina?.name === p.name;
                    return (
                      <button key={p.name} onClick={() => setExtraProteina(sel ? null : p)}
                        style={{ background: sel?'var(--brand-soft)':'var(--surface-sunken)', border:`1.5px solid ${sel?'var(--brand)':'var(--line)'}`, borderRadius:'var(--radius-sm)', padding:'10px 14px', cursor:'pointer', transition:'all .2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${sel?'var(--brand)':'var(--line)'}`, background: sel?'var(--brand)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:10, color:'#fff', fontWeight:900 }}>
                            {sel ? <Check size={10}/> : ''}
                          </div>
                          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, color: sel?'var(--brand)':'var(--ink-900)' }}>{p.name}</span>
                        </div>
                        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color: sel?'var(--brand)':'var(--ink-500)' }}>
                          +{fmt(xPrecio)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Step 3 — Toppings */}
      {step === 3 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--ink-900)' }}>Toppings</div>
          <LimitBadge selected={toppings.length} libre={tLib} max={tMax} xtraPrecio={tXtra} label="toppings" />
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {visToppings.map(t => {
              const sel     = toppings.some(x => x.name === t.name);
              const maxed   = !sel && toppings.length >= tMax;
              const esExtra = !sel && toppings.length >= tLib;
              return (
                <button key={t.name} onClick={() => !maxed && toggleArr(toppings, setToppings, t, tMax)}
                  style={{ padding:'7px 13px', borderRadius:999, border:`2px solid ${sel?'var(--brand)':'var(--line)'}`, background: sel?'var(--brand)':'var(--surface-raised)', color: sel?'#fff':maxed?'var(--line)':'var(--ink-900)', fontWeight:600, fontSize:13, cursor: maxed?'not-allowed':'pointer', opacity: maxed?.35:1, display:'flex', alignItems:'center', gap:5, transition:'all .2s' }}>
                  {t.name}
                  {esExtra && tXtra > 0 && !sel && (
                    <span style={{ fontSize:10, color:'var(--brand)', fontWeight:800 }}>+{fmt(tXtra)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4 — Salsas */}
      {step === 4 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--ink-900)' }}>Salsas</div>
          <LimitBadge selected={salsas.length} libre={sLib} max={sMax} xtraPrecio={sXtra} label="salsas" />
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {visSalsas.map(s => {
              const sel     = salsas.some(x => x.name === s.name);
              const maxed   = !sel && salsas.length >= sMax;
              const esExtra = !sel && salsas.length >= sLib;
              return (
                <button key={s.name} onClick={() => !maxed && toggleArr(salsas, setSalsas, s, sMax)}
                  style={{ padding:'7px 13px', borderRadius:999, border:`2px solid ${sel?'var(--gold)':'var(--line)'}`, background: sel?'rgba(255,214,0,0.12)':'var(--surface-raised)', color: sel?'#8a6800':maxed?'var(--line)':'var(--ink-900)', fontWeight:600, fontSize:13, cursor: maxed?'not-allowed':'pointer', opacity: maxed?.35:1, display:'flex', alignItems:'center', gap:5, transition:'all .2s' }}>
                  {s.name}
                  {esExtra && sXtra > 0 && !sel && (
                    <span style={{ fontSize:10, color:'var(--brand)', fontWeight:800 }}>+{fmt(sXtra)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 5 — Adicionales */}
      {step === 5 && visAdicionales.length > 0 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, marginBottom:4, color:'var(--ink-900)' }}>Adicionales</div>
          <div style={{ fontSize:12, color:'var(--ink-500)', marginBottom:12 }}>
            Extras con costo — doble porción de un ingrediente, extra queso, etc.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {visAdicionales.map(a => {
              const sel = adicionales.some(x => x.name === a.name);
              return (
                <button key={a.name} onClick={() => toggleArr(adicionales, setAdicionales, a, 99)}
                  style={{ background: sel?'var(--brand-soft)':'var(--surface-raised)', border:`2px solid ${sel?'var(--brand)':'var(--line)'}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', cursor:'pointer', transition:'all .2s', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color: sel?'var(--brand)':'var(--ink-900)' }}>{a.name}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--gold)' }}>+{fmt(a.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)}
              style={{ flex:1, padding:'11px', borderRadius:999, border:'2px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>← Atrás</button>
          : <div style={{ flex:1 }}/>
        }
        <button disabled={!canNext[step]}
          onClick={() => { if (step < lastStep) setStep(s => s + 1); else setDone(true); }}
          style={{ flex:2, padding:'11px', borderRadius:999, border:'none', background: canNext[step]?'var(--brand)':'var(--line)', color: canNext[step]?'#fff':'var(--ink-500)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:17, cursor: canNext[step]?'pointer':'not-allowed', transition:'all .2s' }}>
          {step === lastStep ? 'Revisar pedido →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
