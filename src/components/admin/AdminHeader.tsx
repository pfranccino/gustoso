'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  isLive?: boolean;
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, isLive, actions }: AdminHeaderProps) {
  const [kebabOpen, setKebabOpen] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);

  /* Close kebab when clicking outside */
  useEffect(() => {
    if (!kebabOpen) return;
    function onOutside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setKebabOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [kebabOpen]);

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
        <h1 className="adm-header-title" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, color: 'var(--text)',
          lineHeight: 1, margin: 0,
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
            <span className="adm-header-subtitle-text" style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{subtitle}</span>
          </div>
        )}
      </div>

      {actions && (
        <>
          {/* Desktop / tablet: inline actions */}
          <div className="adm-header-actions-wrap" style={{ display: 'none', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
          </div>

          {/* Mobile: kebab ⋯ */}
          <div className="adm-header-kebab" ref={kebabRef} style={{ display: 'none' }}>
            <button
              onClick={() => setKebabOpen(o => !o)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: '1px solid var(--border)',
                background: kebabOpen ? 'var(--bg3)' : 'transparent',
                color: 'var(--text)', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Acciones"
            >
              ⋯
            </button>
            {kebabOpen && (
              <div className="adm-header-kebab-menu" onClick={() => setKebabOpen(false)}>
                {actions}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
