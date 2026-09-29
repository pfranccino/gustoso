'use client';

import { useCart } from '@/contexts/CartContext';

export default function CartToast() {
  const { lastAdded, setIsOpen } = useCart();

  if (!lastAdded) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 500,
      background: 'var(--ink-900)',
      color: 'var(--surface-0)',
      padding: '10px 18px',
      borderRadius: 'var(--r-pill)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: 'var(--e-3)',
      animation: 'slideUp .25s var(--ease-out)',
      maxWidth: 'calc(100% - 32px)',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="8" fill="var(--success)"/>
        <path d="M4.5 8.5L7 11L11.5 5.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 14,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {lastAdded} agregado
      </span>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Ver pedido"
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'var(--surface-0)',
          padding: '4px 10px',
          borderRadius: 'var(--r-pill)',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Ver pedido
      </button>
    </div>
  );
}
