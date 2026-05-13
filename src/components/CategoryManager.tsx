'use client';

import { useState } from 'react';
import type { Category } from '@/lib/firestore/categories';

const EMOJI_SUGGESTIONS = ['🍔','🌭','🥪','🥩','🥖','🌯','🍟','🥤','🍕','🍣','🌮','🌶️','🥗','🧆','🍱','☕','🧃','🍦','🍰','🥞'];

const INPUT: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)',
  background: 'var(--card)', color: 'var(--text)', fontSize: 13,
  fontFamily: "'Barlow',sans-serif", outline: 'none', boxSizing: 'border-box' as const,
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function CategoryManager({ initial }: { initial: Category[] }) {
  const [cats,    setCats]    = useState<Category[]>(initial);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji,setNewEmoji]= useState('');
  const [open,    setOpen]    = useState(false);

  async function save(next: Category[]) {
    setSaving(true); setSaved(false);
    await fetch('/api/admin/categories', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const next = cats.map((c, idx) =>
      idx === i ? { ...cats[j], sortOrder: i } :
      idx === j ? { ...cats[i], sortOrder: j } : c
    );
    // reorder array
    const arr = [...next];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setCats(arr);
    save(arr);
  }

  function toggleVisible(i: number) {
    // prevent hiding special/burrito in a way that can't be recovered
    const next = cats.map((c, idx) => idx === i ? { ...c, visible: !c.visible } : c);
    setCats(next);
    save(next);
  }

  function addCategory() {
    const name = newName.trim();
    if (!name) return;
    const id    = slugify(name);
    if (cats.some(c => c.id === id)) { alert(`Ya existe una categoría con slug "${id}"`); return; }
    const emoji = newEmoji.trim() || '📦';
    const next: Category[] = [...cats, { id, label: name, emoji, sortOrder: cats.length, visible: true }];
    setCats(next);
    save(next);
    setNewName(''); setNewEmoji('');
  }

  function deleteCategory(i: number) {
    const cat = cats[i];
    if (cat.special) { alert('Esta categoría especial no se puede eliminar.'); return; }
    if (!confirm(`¿Eliminar la categoría "${cat.label}"? Los productos que tenían esta categoría quedarán sin categoría visible.`)) return;
    const next = cats.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, sortOrder: idx }));
    setCats(next);
    save(next);
  }

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Toggle header */}
      <button onClick={() => setOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', cursor:'pointer', textAlign:'left' }}>
        <span style={{ fontSize:16 }}>🗂️</span>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--text)', flex:1 }}>Categorías</span>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{cats.length} categoría{cats.length !== 1 ? 's' : ''}</span>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 var(--radius) var(--radius)', padding:16 }}>
          {/* Lista */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
            {cats.map((cat, i) => (
              <div key={cat.id}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--bg2)', borderRadius:8, border:'1px solid var(--border)', opacity: cat.visible ? 1 : 0.5 }}>

                {/* Reorder */}
                <div style={{ display:'flex', flexDirection:'column', gap:1, flexShrink:0 }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    style={{ background:'transparent', border:'none', cursor: i === 0 ? 'not-allowed' : 'pointer', fontSize:10, color:'var(--text-muted)', padding:'1px 4px', lineHeight:1, opacity: i===0?0.3:1 }}>▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1}
                    style={{ background:'transparent', border:'none', cursor: i === cats.length-1 ? 'not-allowed' : 'pointer', fontSize:10, color:'var(--text-muted)', padding:'1px 4px', lineHeight:1, opacity: i===cats.length-1?0.3:1 }}>▼</button>
                </div>

                {/* Emoji */}
                <span style={{ fontSize:18, flexShrink:0 }}>{cat.emoji}</span>

                {/* Nombre + slug */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:'var(--text)' }}>{cat.label}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace' }}>/{cat.id}{cat.special ? ' · especial' : ''}</div>
                </div>

                {/* Toggle visible */}
                <button onClick={() => toggleVisible(i)}
                  title={cat.visible ? 'Ocultar' : 'Mostrar'}
                  style={{ width:32, height:18, borderRadius:999, border:'none', background: cat.visible ? 'var(--orange)' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                  <span style={{ position:'absolute', top:2, left: cat.visible ? 15 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                </button>

                {/* Borrar (solo no-especiales) */}
                {!cat.special && (
                  <button onClick={() => deleteCategory(i)}
                    style={{ padding:'3px 8px', borderRadius:6, border:'1px solid rgba(220,38,38,0.3)', background:'transparent', color:'#dc2626', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>✕</button>
                )}
              </div>
            ))}
          </div>

          {/* Añadir nueva */}
          <div style={{ borderTop:'1px dashed var(--border)', paddingTop:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>Nueva categoría</div>

            {/* Sugerencias emoji */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
              {EMOJI_SUGGESTIONS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  style={{ padding:'4px 7px', borderRadius:6, border:`1.5px solid ${newEmoji===e ? 'var(--orange)' : 'var(--border)'}`, background: newEmoji===e ? 'rgba(242,100,25,0.1)' : 'transparent', fontSize:16, cursor:'pointer', transition:'all .12s' }}>
                  {e}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="Emoji" maxLength={4}
                style={{ ...INPUT, width:72 }} />
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="Nombre de la categoría…"
                style={{ ...INPUT, flex:1, minWidth:140 }} />
              <button onClick={addCategory} disabled={!newName.trim() || saving}
                style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--orange)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: !newName.trim()||saving ? 'not-allowed' : 'pointer', opacity: !newName.trim()||saving ? 0.5 : 1, flexShrink:0 }}>
                + Agregar
              </button>
            </div>

            {newName.trim() && (
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
                Slug: <code style={{ fontFamily:'monospace', color:'var(--orange)' }}>{slugify(newName)}</code>
              </div>
            )}
          </div>

          {saving && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:10 }}>Guardando…</div>}
          {saved  && <div style={{ fontSize:12, color:'#16a34a', fontWeight:600, marginTop:10 }}>✓ Cambios guardados</div>}
        </div>
      )}
    </div>
  );
}
