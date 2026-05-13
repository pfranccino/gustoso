'use client';

import React from 'react';
import AdminToggle from './AdminToggle';

interface EditableItemRowProps {
  name: string;
  price?: number | string;
  pricePlaceholder?: string;
  available?: boolean;
  onNameChange?: (v: string) => void;
  onPriceChange?: (v: string) => void;
  onAvailableChange?: (v: boolean) => void;
  onDelete?: () => void;
  /** Extra content after price (e.g. XL price) */
  extra?: React.ReactNode;
  disabled?: boolean;
}

export default function EditableItemRow({
  name, price, pricePlaceholder = '0', available = true,
  onNameChange, onPriceChange, onAvailableChange, onDelete,
  extra, disabled,
}: EditableItemRowProps) {
  const INPUT: React.CSSProperties = {
    padding: '6px 9px', borderRadius: 6, border: '1.5px solid rgba(242,100,25,0.2)',
    background: 'var(--bg2)', color: 'var(--text)', fontSize: 12,
    fontFamily: "'Barlow', sans-serif", outline: 'none',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 0', borderBottom: '1px solid var(--border)',
    }}>
      {onAvailableChange && (
        <AdminToggle value={available} onChange={onAvailableChange} aria-label={`Disponibilidad de ${name}`} disabled={disabled}/>
      )}
      {onNameChange ? (
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          disabled={disabled}
          style={{ ...INPUT, flex: 1, minWidth: 80 }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{name}</span>
      )}
      {onPriceChange !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
          <input
            type="number"
            value={price ?? ''}
            placeholder={pricePlaceholder}
            onChange={e => onPriceChange(e.target.value)}
            disabled={disabled}
            style={{ ...INPUT, width: 72, textAlign: 'right' }}
          />
        </div>
      )}
      {extra}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled}
          title="Eliminar"
          style={{
            width: 26, height: 26, borderRadius: 5, border: '1px solid rgba(220,38,38,0.25)',
            background: 'transparent', color: '#dc2626', fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >×</button>
      )}
    </div>
  );
}
