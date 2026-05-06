'use client';

import { useState, useTransition } from 'react';
import { BurritoConfig, BurritoItem, BurritoProtein } from '@/lib/firestore/burritoConfig';

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`;

const INPUT: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 8,
  border: '1.5px solid rgba(242,100,25,0.25)',
  background: '#FFF9F5', color: '#1A0800',
  fontSize: 13, fontFamily: "'Barlow',sans-serif",
  outline: 'none',
};

const SECTION_LABELS: Partial<Record<keyof BurritoConfig, string>> = {
  rellenos:    '🫔 Rellenos',
  proteinas:   '🥩 Proteínas',
  toppings:    '🥬 Toppings',
  salsas:      '🫙 Salsas',
  adicionales: '➕ Adicionales',
};

/* ── helpers de sección ──────────────────────────────────────── */

function ItemRow({
  item, onChange, onDelete,
}: {
  item: BurritoItem;
  onChange: (updated: BurritoItem) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#FFF9F5', border:'1px solid rgba(242,100,25,0.15)', borderRadius:8 }}>
      {/* Toggle visible */}
      <button onClick={() => onChange({ ...item, visible: !item.visible })}
        style={{ flexShrink:0, width:32, height:18, borderRadius:999, border:'none',
          background: item.visible ? '#F26419' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s' }}>
        <span style={{ position:'absolute', top:2, left: item.visible ? 15 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
      </button>

      {/* Name */}
      <input value={item.name} onChange={e => onChange({ ...item, name: e.target.value })}
        style={{ ...INPUT, flex:1, opacity: item.visible ? 1 : 0.45 }} />

      {/* Price */}
      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        <span style={{ fontSize:12, color:'#A0541A', fontWeight:600 }}>+$</span>
        <input type="number" value={item.price || ''} placeholder="0"
          onChange={e => onChange({ ...item, price: parseInt(e.target.value, 10) || 0 })}
          style={{ ...INPUT, width:72, opacity: item.visible ? 1 : 0.45 }} />
      </div>

      {/* Price label */}
      <span style={{ fontSize:11, color: item.price > 0 ? '#F26419' : '#16a34a', fontWeight:700, minWidth:42, textAlign:'right', flexShrink:0 }}>
        {item.price > 0 ? fmt(item.price) : 'incluido'}
      </span>

      {/* Delete */}
      <button onClick={onDelete}
        style={{ flexShrink:0, fontSize:14, color:'#dc2626', background:'transparent', border:'none', cursor:'pointer', fontWeight:700, padding:'0 4px', lineHeight:1 }}>✕</button>
    </div>
  );
}

function ProteinRow({
  item, onChange, onDelete,
}: {
  item: BurritoProtein;
  onChange: (updated: BurritoProtein) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#FFF9F5', border:'1px solid rgba(242,100,25,0.15)', borderRadius:8, flexWrap:'wrap' }}>
      <button onClick={() => onChange({ ...item, visible: !item.visible })}
        style={{ flexShrink:0, width:32, height:18, borderRadius:999, border:'none',
          background: item.visible ? '#F26419' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s' }}>
        <span style={{ position:'absolute', top:2, left: item.visible ? 15 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
      </button>

      <input value={item.name} onChange={e => onChange({ ...item, name: e.target.value })}
        style={{ ...INPUT, flex:1, minWidth:120, opacity: item.visible ? 1 : 0.45 }} />

      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        <span style={{ fontSize:11, color:'#A0541A', fontWeight:700 }}>Normal</span>
        <input type="number" value={item.normal || ''} placeholder="0"
          onChange={e => onChange({ ...item, normal: parseInt(e.target.value, 10) || 0 })}
          style={{ ...INPUT, width:76, opacity: item.visible ? 1 : 0.45 }} />
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        <span style={{ fontSize:11, color:'#F26419', fontWeight:700 }}>XL</span>
        <input type="number" value={item.xl || ''} placeholder="0"
          onChange={e => onChange({ ...item, xl: parseInt(e.target.value, 10) || 0 })}
          style={{ ...INPUT, width:76, opacity: item.visible ? 1 : 0.45 }} />
      </div>

      <button onClick={onDelete}
        style={{ flexShrink:0, fontSize:14, color:'#dc2626', background:'transparent', border:'none', cursor:'pointer', fontWeight:700, padding:'0 4px', lineHeight:1 }}>✕</button>
    </div>
  );
}

/* ── componente principal ────────────────────────────────────── */

export default function BurritoEditor({ initial }: { initial: BurritoConfig }) {
  const [config, setConfig] = useState<BurritoConfig>(initial);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');
  const [isPending, startTransition] = useTransition();

  // State for new-item inputs per section
  const [newItem,    setNewItem]    = useState<Record<string, string>>({});
  const [newPrice,   setNewPrice]   = useState<Record<string, string>>({});
  const [newNormal,  setNewNormal]  = useState('');
  const [newXL,      setNewXL]      = useState('');
  const [newProtein, setNewProtein] = useState('');

  /* ── mutators ──────────────────────────────────────────────── */

  function updateItem(section: 'rellenos' | 'toppings' | 'salsas' | 'adicionales', idx: number, updated: BurritoItem) {
    setConfig(c => ({ ...c, [section]: c[section].map((it, i) => i === idx ? updated : it) as BurritoItem[] }));
    setSaved(false);
  }

  function deleteItem(section: 'rellenos' | 'toppings' | 'salsas' | 'adicionales', idx: number) {
    setConfig(c => ({ ...c, [section]: (c[section] as BurritoItem[]).filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  function addItem(section: 'rellenos' | 'toppings' | 'salsas' | 'adicionales') {
    const name = (newItem[section] ?? '').trim();
    if (!name) return;
    const price = parseInt(newPrice[section] ?? '0', 10) || 0;
    setConfig(c => ({ ...c, [section]: [...(c[section] as BurritoItem[]), { name, price, visible: true }] }));
    setNewItem(v => ({ ...v, [section]: '' }));
    setNewPrice(v => ({ ...v, [section]: '' }));
    setSaved(false);
  }

  function updateProtein(idx: number, updated: BurritoProtein) {
    setConfig(c => ({ ...c, proteinas: c.proteinas.map((p, i) => i === idx ? updated : p) }));
    setSaved(false);
  }

  function deleteProtein(idx: number) {
    setConfig(c => ({ ...c, proteinas: c.proteinas.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  function addProtein() {
    const name = newProtein.trim();
    if (!name) return;
    setConfig(c => ({ ...c, proteinas: [...c.proteinas, { name, normal: parseInt(newNormal, 10) || 0, xl: parseInt(newXL, 10) || 0, visible: true }] }));
    setNewProtein(''); setNewNormal(''); setNewXL('');
    setSaved(false);
  }

  /* ── save ──────────────────────────────────────────────────── */

  function handleSave() {
    setError(''); setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/burrito', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        if (!res.ok) throw new Error();
        setSaved(true);
      } catch {
        setError('Error al guardar. Intenta de nuevo.');
      }
    });
  }

  /* ── render helpers ────────────────────────────────────────── */

  const sectionStyle: React.CSSProperties = {
    background:'var(--card)', border:'1px solid var(--border)',
    borderRadius:'var(--radius)', padding:'20px', marginBottom:16,
  };

  const addRowStyle: React.CSSProperties = {
    display:'flex', gap:8, marginTop:12, flexWrap:'wrap',
  };

  function renderSimpleSection(section: 'rellenos' | 'toppings' | 'salsas' | 'adicionales') {
    const items = config[section] as BurritoItem[];
    const showPrice = section !== 'rellenos';
    return (
      <div style={sectionStyle}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:4 }}>
          {SECTION_LABELS[section]}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>
          {section === 'rellenos'    && 'Base del burrito. Precio siempre incluido en la proteína.'}
          {section === 'toppings'    && `Máx ${config.toppingsMax} · ${config.toppingsLibres} incluidos gratis${config.toppingExtraPrecio > 0 ? `, +$${config.toppingExtraPrecio.toLocaleString('es-CL')} c/u extra` : ''}. Configura los límites abajo.`}
          {section === 'salsas'      && `Máx ${config.salsasMax} · ${config.salsasLibres} incluidas gratis${config.salsaExtraPrecio > 0 ? `, +$${config.salsaExtraPrecio.toLocaleString('es-CL')} c/u extra` : ''}. Configura los límites abajo.`}
          {section === 'adicionales' && 'Extras opcionales de pago. Ej: doble proteína, extra queso.'}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {items.map((item, idx) => (
            <ItemRow key={idx} item={item}
              onChange={updated => updateItem(section, idx, updated)}
              onDelete={() => deleteItem(section, idx)} />
          ))}
        </div>

        {/* Add row */}
        <div style={addRowStyle}>
          <input value={newItem[section] ?? ''} placeholder={`Nuevo ${section === 'rellenos' ? 'relleno' : section === 'toppings' ? 'topping' : 'salsa'}…`}
            onChange={e => setNewItem(v => ({ ...v, [section]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addItem(section)}
            style={{ ...INPUT, flex:1, minWidth:140 }} />
          {showPrice && (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:12, color:'#A0541A', fontWeight:600 }}>+$</span>
              <input type="number" value={newPrice[section] ?? ''} placeholder="0 = incluido"
                onChange={e => setNewPrice(v => ({ ...v, [section]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem(section)}
                style={{ ...INPUT, width:100 }} />
            </div>
          )}
          <button onClick={() => addItem(section)}
            style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#F26419', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + Agregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:620 }}>
      {/* Rellenos */}
      {renderSimpleSection('rellenos')}

      {/* Proteínas */}
      <div style={sectionStyle}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:4 }}>
          {SECTION_LABELS.proteinas}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>
          Precio Normal y XL por proteína.
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {config.proteinas.map((p, idx) => (
            <ProteinRow key={idx} item={p}
              onChange={updated => updateProtein(idx, updated)}
              onDelete={() => deleteProtein(idx)} />
          ))}
        </div>

        {/* Add protein */}
        <div style={addRowStyle}>
          <input value={newProtein} placeholder="Nueva proteína…"
            onChange={e => setNewProtein(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addProtein()}
            style={{ ...INPUT, flex:1, minWidth:120 }} />
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#A0541A', fontWeight:700 }}>Normal $</span>
            <input type="number" value={newNormal} placeholder="0"
              onChange={e => setNewNormal(e.target.value)}
              style={{ ...INPUT, width:76 }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#F26419', fontWeight:700 }}>XL $</span>
            <input type="number" value={newXL} placeholder="0"
              onChange={e => setNewXL(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addProtein()}
              style={{ ...INPUT, width:76 }} />
          </div>
          <button onClick={addProtein}
            style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'#F26419', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Extra proteína */}
      <div style={sectionStyle}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:4 }}>
          🍗 Extra Proteína
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
          Permite al cliente pedir doble porción de su proteína elegida pagando un adicional.
        </div>

        {/* Toggle habilitada */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <button onClick={() => { setConfig(c => ({ ...c, proteinaExtraHabilitada: !c.proteinaExtraHabilitada })); setSaved(false); }}
            style={{ flexShrink:0, width:36, height:20, borderRadius:999, border:'none',
              background: config.proteinaExtraHabilitada ? '#F26419' : '#d1d5db',
              cursor:'pointer', position:'relative', transition:'background .2s' }}>
            <span style={{ position:'absolute', top:3, left: config.proteinaExtraHabilitada ? 17 : 3, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
          </button>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
            {config.proteinaExtraHabilitada ? 'Habilitada — aparece en el paso Proteína' : 'Deshabilitada'}
          </span>
        </div>

        {config.proteinaExtraHabilitada && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:120 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Precio extra Normal ($)</label>
              <input type="number" min={0} value={config.proteinaExtraPrecioNormal}
                onChange={e => { setConfig(c => ({ ...c, proteinaExtraPrecioNormal: parseInt(e.target.value, 10) || 0 })); setSaved(false); }}
                style={{ ...INPUT }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:120 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Precio extra XL ($)</label>
              <input type="number" min={0} value={config.proteinaExtraPrecioXL}
                onChange={e => { setConfig(c => ({ ...c, proteinaExtraPrecioXL: parseInt(e.target.value, 10) || 0 })); setSaved(false); }}
                style={{ ...INPUT }} />
            </div>
          </div>
        )}
      </div>

      {/* Toppings */}
      {renderSimpleSection('toppings')}

      {/* Salsas */}
      {renderSimpleSection('salsas')}

      {/* Adicionales */}
      {renderSimpleSection('adicionales')}

      {/* Límites y precios extra */}
      <div style={sectionStyle}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:4 }}>
          ⚙️ Límites y cobro por extras
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
          Define cuántos toppings y salsas van incluidos gratis y cuánto cobrar por cada uno adicional.
        </div>

        {/* Toppings limits */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', marginBottom:10 }}>🥬 Toppings</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:100 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Máx seleccionables</label>
              <input type="number" min={1} max={20} value={config.toppingsMax}
                onChange={e => { setConfig(c => ({ ...c, toppingsMax: parseInt(e.target.value, 10) || 1 })); setSaved(false); }}
                style={{ ...INPUT, width:'100%' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:100 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Incluidos gratis</label>
              <input type="number" min={0} max={20} value={config.toppingsLibres}
                onChange={e => { setConfig(c => ({ ...c, toppingsLibres: parseInt(e.target.value, 10) || 0 })); setSaved(false); }}
                style={{ ...INPUT, width:'100%' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:100 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Precio c/u extra ($)</label>
              <input type="number" min={0} value={config.toppingExtraPrecio}
                onChange={e => { setConfig(c => ({ ...c, toppingExtraPrecio: parseInt(e.target.value, 10) || 0 })); setSaved(false); }}
                style={{ ...INPUT, width:'100%' }} />
            </div>
          </div>
          {config.toppingExtraPrecio > 0 && (
            <div style={{ fontSize:12, color:'#F26419', fontWeight:600, marginTop:8 }}>
              ℹ️ El cliente verá: &quot;{config.toppingsLibres} incluidos gratis · +${config.toppingExtraPrecio.toLocaleString('es-CL')} por cada topping extra&quot;
            </div>
          )}
        </div>

        {/* Salsas limits */}
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--text)', marginBottom:10 }}>🫙 Salsas</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:100 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Máx seleccionables</label>
              <input type="number" min={1} max={20} value={config.salsasMax}
                onChange={e => { setConfig(c => ({ ...c, salsasMax: parseInt(e.target.value, 10) || 1 })); setSaved(false); }}
                style={{ ...INPUT, width:'100%' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:100 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Incluidas gratis</label>
              <input type="number" min={0} max={20} value={config.salsasLibres}
                onChange={e => { setConfig(c => ({ ...c, salsasLibres: parseInt(e.target.value, 10) || 0 })); setSaved(false); }}
                style={{ ...INPUT, width:'100%' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:100 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>Precio c/u extra ($)</label>
              <input type="number" min={0} value={config.salsaExtraPrecio}
                onChange={e => { setConfig(c => ({ ...c, salsaExtraPrecio: parseInt(e.target.value, 10) || 0 })); setSaved(false); }}
                style={{ ...INPUT, width:'100%' }} />
            </div>
          </div>
          {config.salsaExtraPrecio > 0 && (
            <div style={{ fontSize:12, color:'#F26419', fontWeight:600, marginTop:8 }}>
              ℹ️ El cliente verá: &quot;{config.salsasLibres} incluidas gratis · +${config.salsaExtraPrecio.toLocaleString('es-CL')} por cada salsa extra&quot;
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      {error  && <div style={{ fontSize:13, color:'#dc2626', fontWeight:600, marginBottom:12 }}>{error}</div>}
      {saved  && <div style={{ fontSize:13, color:'#16a34a', fontWeight:600, marginBottom:12 }}>✓ Guardado correctamente</div>}
      <button onClick={handleSave} disabled={isPending}
        style={{ width:'100%', padding:'13px', borderRadius:999, border:'none',
          background: isPending ? '#d1bfb8' : '#F26419', color:'#fff',
          fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20,
          cursor: isPending ? 'not-allowed' : 'pointer',
          boxShadow: isPending ? 'none' : '0 4px 16px rgba(242,100,25,0.30)' }}>
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}
