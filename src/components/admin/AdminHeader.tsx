import React from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  isLive?: boolean;
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, isLive, actions }: AdminHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '28px 0 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 10,
      backdropFilter: 'blur(8px)',
      marginBottom: 24,
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: 32, color: 'var(--text)',
          letterSpacing: -0.5, lineHeight: 1, margin: 0,
        }}>{title}</h1>
        {subtitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            {isLive && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 0 4px rgba(21,128,61,0.2)',
                display: 'inline-block', flexShrink: 0,
              }}/>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{subtitle}</span>
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
