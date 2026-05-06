'use client';

import { useState, useTransition } from 'react';
import { DiscountCode, DiscountType } from '@/lib/firestore/discountCodes';

const INPUT: React.CSSProperties = {
  padding: '8px 11px', borderRadius: 8,
  border: '1.5px solid rgba(242,100,25,0.25)',
  background: '#FFF9F5', color: '#1A0800',
  fontSize: 13, fontFamily: "'Barlow',sans-serif",
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() {
  let c = 'GUST-';
  for (let i = 0; i < 5; i++) c += CHARS[Math.floor(Math.random() * CHARS.length)];
  return c;
}

type FormState = {
  code: string;
  type: DiscountType;
  value: string;
  description: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
};

const EMPTY: FormState = {
  code: '', type: 'fixed', value: '', description: '',
  maxUses: '1', expiresAt: '', active: true,
};

function formatDiscount(code: DiscountCode) {
  return code.type === 'percent'
    ? `${code.value}%`
    : `$${code.value.toLocaleString('es-CL')}`;
}

function usesLabel(code: DiscountCode) {
  if (code.maxUses === 0) return `${code.usedCount} usos (ilimitado)`;
  return `${code.usedCount} / ${code.maxUses} uso${code.maxUses !== 1 ? 's' : ''}`;
}

function isExpired(code: DiscountCode) {
  return !!code.expiresAt && new Date(code.expiresAt) < new Date();
}

/* ── Modal ──────────────────────────────── */

function CodeModal({
  title, form, setForm, onSave, onCancel, saving, error, isEdit,
}: {
  title: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  isEdit: boolean;
}) {
  const canSave = form.code.trim().length >= 3 && !!form.value && Number(form.value) > 0;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background:'var(--card)', borderRadius:'16px 16px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)', marginBottom:20 }}>{title}</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Código */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>Código</label>
            <div style={{ display:'flex', gap:6 }}>
              <input value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') }))}
                placeholder="Ej: GUST-AB123"
                disabled={isEdit}
                style={{ ...INPUT, flex:1, opacity: isEdit ? 0.6 : 1 }} />
              {!isEdit && (
                <button onClick={() => setForm(f => ({ ...f, code: genCode() }))}
                  style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid rgba(242,100,25,0.25)', background:'transparent', color:'#A0541A', fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                  🎲 Auto
                </button>
              )}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>Tipo de descuento</label>
            <div style={{ display:'flex', gap:8 }}>
              {([['fixed','💵 Monto fijo ($)'],['percent','% Porcentaje']] as [DiscountType, string][]).map(([id, label]) => {
                const sel = form.type === id;
                return (
                  <button key={id} onClick={() => setForm(f => ({ ...f, type: id }))}
                    style={{ flex:1, padding:'10px 8px', borderRadius:10, border:`2px solid ${sel ? '#F26419' : 'rgba(242,100,25,0.2)'}`, background: sel ? 'rgba(242,100,25,0.08)' : 'transparent', color: sel ? '#F26419' : '#A0541A', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer', transition:'all .15s' }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valor */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>
              {form.type === 'percent' ? 'Porcentaje (1–100)' : 'Monto ($)'}
            </label>
            <input type="number" min="1" max={form.type === 'percent' ? 100 : undefined}
              value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder={form.type === 'percent' ? 'Ej: 10' : 'Ej: 1000'}
              style={INPUT} />
          </div>

          {/* Descripción interna */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>
              Descripción interna <span style={{ fontWeight:400, textTransform:'none' }}>(solo tú la ves)</span>
            </label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Para Juan por el pedido equivocado"
              style={INPUT} />
          </div>

          {/* Máximo usos */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>
              Usos máximos <span style={{ fontWeight:400, textTransform:'none' }}>(0 = ilimitado)</span>
            </label>
            <input type="number" min="0" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              style={INPUT} />
          </div>

          {/* Expiración */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase', display:'block', marginBottom:5 }}>
              Expira el <span style={{ fontWeight:400, textTransform:'none' }}>(opcional)</span>
            </label>
            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              style={INPUT} />
          </div>

          {/* Activo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              style={{ width:36, height:20, borderRadius:999, border:'none', background: form.active ? '#F26419' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:3, left: form.active ? 17 : 3, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
            </button>
            <span style={{ fontSize:13, color:'var(--text)', fontWeight:600 }}>
              {form.active ? 'Activo — clientes pueden usar este código' : 'Desactivado'}
            </span>
          </div>
        </div>

        {error && <div style={{ fontSize:13, color:'#dc2626', fontWeight:600, marginTop:14 }}>{error}</div>}

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex:1, padding:'11px', borderRadius:999, border:'1.5px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving || !canSave}
            style={{ flex:2, padding:'11px', borderRadius:999, border:'none', background:'#F26419', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, cursor: (saving || !canSave) ? 'not-allowed' : 'pointer', opacity: (saving || !canSave) ? 0.6 : 1 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── DiscountsEditor ────────────────────── */

export default function DiscountsEditor({ initial }: { initial: DiscountCode[] }) {
  const [codes,    setCodes]    = useState<DiscountCode[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<DiscountCode | null>(null);
  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [error,    setError]    = useState('');
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm({ ...EMPTY, code: genCode() });
    setError('');
    setCreating(true);
  }

  function openEdit(c: DiscountCode) {
    setForm({
      code:        c.code,
      type:        c.type,
      value:       String(c.value),
      description: c.description,
      maxUses:     String(c.maxUses),
      expiresAt:   c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      active:      c.active,
    });
    setError('');
    setEditing(c);
  }

  function parseForm(f: FormState) {
    return {
      code:        f.code.trim().toUpperCase(),
      type:        f.type,
      value:       Number(f.value) || 0,
      description: f.description.trim(),
      maxUses:     Number(f.maxUses) || 0,
      expiresAt:   f.expiresAt || null,
      active:      f.active,
    };
  }

  function handleCreate() {
    setError('');
    startTransition(async () => {
      try {
        const body = parseForm(form);
        const res  = await fetch('/api/admin/discounts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.status === 409) { setError('Ese código ya existe. Usa otro nombre.'); return; }
        if (!res.ok) throw new Error();
        setCodes(cs => [{
          id: body.code, ...body, usedCount: 0,
          createdAt: new Date().toISOString(),
        }, ...cs]);
        setCreating(false);
      } catch { setError('Error al crear. Intenta de nuevo.'); }
    });
  }

  function handleUpdate() {
    if (!editing) return;
    setError('');
    startTransition(async () => {
      try {
        const { description, maxUses, expiresAt, active } = parseForm(form);
        const res = await fetch(`/api/admin/discounts/${editing.code}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, maxUses, expiresAt, active }),
        });
        if (!res.ok) throw new Error();
        setCodes(cs => cs.map(c => c.id === editing.id ? { ...c, description, maxUses, expiresAt, active } : c));
        setEditing(null);
      } catch { setError('Error al guardar. Intenta de nuevo.'); }
    });
  }

  function handleToggle(c: DiscountCode) {
    startTransition(async () => {
      const active = !c.active;
      await fetch(`/api/admin/discounts/${c.code}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      setCodes(cs => cs.map(x => x.id === c.id ? { ...x, active } : x));
    });
  }

  function handleDelete(c: DiscountCode) {
    if (!confirm(`¿Eliminar el código "${c.code}"?`)) return;
    startTransition(async () => {
      await fetch(`/api/admin/discounts/${c.code}`, { method: 'DELETE' });
      setCodes(cs => cs.filter(x => x.id !== c.id));
    });
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Lista */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
        {codes.length === 0 && (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🏷</div>
            <div style={{ fontSize:14, color:'var(--text-muted)' }}>No hay códigos aún. Crea el primero.</div>
          </div>
        )}

        {codes.map(c => {
          const expired = isExpired(c);
          const exhausted = c.maxUses > 0 && c.usedCount >= c.maxUses;
          const inactive = !c.active || expired || exhausted;

          return (
            <div key={c.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start', opacity: inactive ? 0.6 : 1 }}>
              {/* Toggle activo */}
              <button onClick={() => handleToggle(c)}
                style={{ flexShrink:0, marginTop:2, width:32, height:18, borderRadius:999, border:'none', background: c.active ? '#F26419' : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s' }}>
                <span style={{ position:'absolute', top:2, left: c.active ? 15 : 2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
              </button>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--orange)', letterSpacing:1 }}>{c.code}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--text)' }}>{formatDiscount(c)}</span>
                  {expired   && <span style={{ fontSize:11, fontWeight:700, background:'rgba(220,38,38,0.1)', color:'#dc2626', padding:'2px 7px', borderRadius:4 }}>Expirado</span>}
                  {exhausted && <span style={{ fontSize:11, fontWeight:700, background:'rgba(220,38,38,0.1)', color:'#dc2626', padding:'2px 7px', borderRadius:4 }}>Sin usos</span>}
                  {!c.active && !expired && !exhausted && <span style={{ fontSize:11, fontWeight:700, background:'var(--bg2)', color:'var(--text-muted)', padding:'2px 7px', borderRadius:4 }}>Desactivado</span>}
                </div>

                {c.description && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}>{c.description}</div>}

                <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>🔢 {usesLabel(c)}</span>
                  {c.expiresAt && (
                    <span style={{ fontSize:11, color: expired ? '#dc2626' : 'var(--text-muted)' }}>
                      📅 Vence {new Date(c.expiresAt).toLocaleDateString('es-CL')}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => openEdit(c)}
                  style={{ padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(c)}
                  style={{ padding:'5px 10px', borderRadius:8, border:'1px solid rgba(220,38,38,0.3)', background:'transparent', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón crear */}
      <button onClick={openCreate}
        style={{ width:'100%', padding:'13px', borderRadius:999, border:'2px dashed rgba(242,100,25,0.4)', background:'rgba(242,100,25,0.04)', color:'#F26419', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor:'pointer' }}>
        + Nuevo código de descuento
      </button>

      {/* Modals */}
      {creating && (
        <CodeModal title="Nuevo código" form={form} setForm={setForm} isEdit={false}
          onSave={handleCreate} onCancel={() => setCreating(false)} saving={isPending} error={error} />
      )}
      {editing && (
        <CodeModal title="Editar código" form={form} setForm={setForm} isEdit={true}
          onSave={handleUpdate} onCancel={() => setEditing(null)} saving={isPending} error={error} />
      )}
    </div>
  );
}
