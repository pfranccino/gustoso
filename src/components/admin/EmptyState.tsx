import React from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ emoji, title, subtitle, action }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 56, opacity: 0.4, lineHeight: 1 }}>{emoji}</span>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900, fontSize: 22, color: 'var(--text)', marginTop: 4,
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
