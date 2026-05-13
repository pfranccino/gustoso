import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'dark';
type Size    = 'sm' | 'md' | 'lg';

interface AdminButtonProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--orange)', color: '#fff', border: 'none' },
  ghost:   { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  danger:  { background: 'transparent', color: '#dc2626', border: '1px solid rgba(220,38,38,0.35)' },
  dark:    { background: 'var(--text)', color: 'var(--bg)', border: 'none' },
};

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: 11, borderRadius: 7 },
  md: { padding: '8px 16px', fontSize: 12, borderRadius: 8 },
  lg: { padding: '10px 20px', fontSize: 14, borderRadius: 10 },
};

export default function AdminButton({
  variant = 'ghost', size = 'md', children, onClick, disabled, type = 'button', style,
}: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700, letterSpacing: 0.3, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        transition: 'opacity .15s',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
