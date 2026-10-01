import React from 'react';

/* ── Shared input style ─────────────────────────────── */

const BASE: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 11px',
  borderRadius: 8,
  border: '1.5px solid var(--line)',
  background: 'var(--surface-sunken)',
  color: 'var(--ink-900)',
  fontSize: 13,
  fontFamily: "'Barlow', sans-serif",
  outline: 'none',
  transition: 'border-color .15s',
};

/* ── AdminLabel ─────────────────────────────────────── */

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  style?: React.CSSProperties;
}

export function AdminLabel({ children, htmlFor, style }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: 11, fontWeight: 700, color: 'var(--ink-500)',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5,
        ...style,
      }}
    >
      {children}
    </label>
  );
}

/* ── AdminInput ─────────────────────────────────────── */

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> & {
  style?: React.CSSProperties;
};

export default function AdminInput({ style, ...props }: InputProps) {
  return (
    <input
      {...props}
      style={{ ...BASE, ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
    />
  );
}

/* ── AdminTextarea ──────────────────────────────────── */

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> & {
  style?: React.CSSProperties;
};

export function AdminTextarea({ style, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      style={{ ...BASE, resize: 'vertical', minHeight: 72, ...style }}
      onFocus={e => { e.currentTarget.style.borderColor = 'var(--brand)'; }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)'; }}
    />
  );
}

/* ── AdminSelect ────────────────────────────────────── */

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'style'> & {
  style?: React.CSSProperties;
};

export function AdminSelect({ style, children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      style={{ ...BASE, cursor: 'pointer', ...style }}
    >
      {children}
    </select>
  );
}
