'use client';

import { useState, useTransition } from 'react';
import { Ban, CheckCircle, Leaf } from 'lucide-react';
import { IngredientStatus } from '@/lib/firestore/ingredientStatus';

export default function IngredientsStatusEditor({ ingredients }: { ingredients: IngredientStatus[] }) {
  const [items, setItems]   = useState<IngredientStatus[]>(ingredients);
  const [isPending, start]  = useTransition();

  function toggle(name: string) {
    const current = items.find(i => i.name === name);
    if (!current) return;
    const next = !current.available;
    setItems(prev => prev.map(i => i.name === name ? { ...i, available: next } : i));
    start(async () => {
      try {
        await fetch('/api/admin/ingredient-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, available: next }),
        });
      } catch {
        // Revertir si falla
        setItems(prev => prev.map(i => i.name === name ? { ...i, available: current.available } : i));
      }
    });
  }

  const disabled  = items.filter(i => !i.available);
  const available = items.filter(i => i.available);

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ marginBottom: 10 }}><Leaf size={32} style={{color:'var(--ink-500)'}}/></div>
        <div style={{ fontSize: 14, color: 'var(--ink-500)' }}>No hay ingredientes en el menú todavía.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      {isPending && (
        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 12, fontWeight: 600 }}>Guardando…</div>
      )}

      {/* Deshabilitados */}
      {disabled.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            <Ban size={12} style={{display:'inline', verticalAlign:'middle'}}/> No disponibles ({disabled.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {disabled.map(ing => (
              <IngredientRow key={ing.name} ing={ing} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}

      {/* Disponibles */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          <CheckCircle size={12} style={{display:'inline', verticalAlign:'middle'}}/> Disponibles ({available.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {available.map(ing => (
            <IngredientRow key={ing.name} ing={ing} onToggle={toggle} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IngredientRow({ ing, onToggle }: { ing: IngredientStatus; onToggle: (name: string) => void }) {
  return (
    <div style={{ background: 'var(--surface-raised)', border: `1px solid ${ing.available ? 'var(--line)' : 'rgba(220,38,38,0.25)'}`, borderRadius: 'var(--radius-lg)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: ing.available ? 1 : 0.7 }}>
      <button
        onClick={() => onToggle(ing.name)}
        style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 999, border: 'none', background: ing.available ? 'var(--brand)' : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}
      >
        <span style={{ position: 'absolute', top: 3, left: ing.available ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--ink-900)', flex: 1 }}>
        {ing.name}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: ing.available ? '#16a34a' : '#dc2626' }}>
        {ing.available ? 'Disponible' : 'No disponible'}
      </span>
    </div>
  );
}
