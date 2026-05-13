import React from 'react';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}

export default function AdminCard({ title, subtitle, actions, children, padding, style }: AdminCardProps) {
  const hasHeader = title || subtitle || actions;
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(60,30,10,0.04), 0 8px 24px rgba(60,30,10,0.06)',
      overflow: 'hidden',
      ...style,
    }}>
      {hasHeader && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          gap: 10,
        }}>
          <div>
            {title && (
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 17, color: 'var(--text)', lineHeight: 1,
              }}>{title}</div>
            )}
            {subtitle && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: padding ?? (hasHeader ? '16px 20px' : '18px 20px') }}>
        {children}
      </div>
    </div>
  );
}
