'use client';

interface AdminToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  'aria-label': string;
  disabled?: boolean;
}

export default function AdminToggle({ value, onChange, disabled, ...rest }: AdminToggleProps) {
  const ariaLabel = rest['aria-label'];
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 32, height: 18, borderRadius: 999, border: 'none', padding: 0,
        background: value ? '#16a34a' : '#d1d5db',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background .2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: value ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left .2s',
        display: 'block',
      }}/>
    </button>
  );
}
