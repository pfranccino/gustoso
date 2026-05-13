'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';

const NAV_GROUPS = [
  {
    label: 'Operaciones',
    items: [
      { href: '/admin/orders',    label: 'Pedidos',    emoji: '📋' },
      { href: '/admin/dashboard', label: 'Dashboard',  emoji: '📊' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/menu',        label: 'Menú',         emoji: '🍔' },
      { href: '/admin/burrito',     label: 'Burrito',      emoji: '🌯' },
      { href: '/admin/promotions',  label: 'Promos',       emoji: '🎁' },
      { href: '/admin/discounts',   label: 'Descuentos',   emoji: '🏷️' },
      { href: '/admin/aderezos',    label: 'Aderezos',     emoji: '🥫' },
      { href: '/admin/ingredients', label: 'Ingredientes', emoji: '🥬' },
    ],
  },
  {
    label: 'Negocios',
    items: [
      { href: '/admin/costs', label: 'Costos', emoji: '💰' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/gallery', label: 'Galería',  emoji: '📷' },
      { href: '/admin/reviews', label: 'Reseñas',  emoji: '⭐' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/settings', label: 'Config',    emoji: '⚙️' },
      { href: '/admin/routes',   label: 'Rutas',     emoji: '🗺️' },
      { href: '/admin/seed',     label: 'Seed',      emoji: '🌱' },
    ],
  },
];

const W = 220; // sidebar width px

export default function AdminSidebar({ email }: { email: string }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open, setOpen] = useState(false);

  // cierra drawer en cambio de ruta
  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  /* ── contenido del nav (reutilizado en desktop y drawer) ── */
  const NavContent = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Logo */}
      <div style={{ padding:'18px 16px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <Logo size={20}/>
      </div>

      {/* Grupos */}
      <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom:2 }}>
            <div style={{ padding:'10px 16px 4px', fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:1.2, textTransform:'uppercase' }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const active = pathname === item.href;
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'9px 16px', border:'none', cursor:'pointer', textAlign:'left',
                    transition:'background .12s, color .12s',
                    borderLeft: active ? '3px solid var(--orange)' : '3px solid transparent',
                    background:  active ? 'rgba(242,100,25,0.09)' : 'transparent',
                    color:       active ? 'var(--orange)' : 'var(--text-muted)',
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontWeight: active ? 800 : 600,
                    fontSize: 14,
                  }}>
                  <span style={{ fontSize:16, flexShrink:0, lineHeight:1 }}>{item.emoji}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: perfil + logout */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'12px 16px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'6px 10px', background:'var(--bg2)', borderRadius:8, border:'1px solid var(--border)' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--orange)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:900, color:'#fff' }}>
            {(email || 'A')[0].toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {email || 'Admin'}
            </div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>Administrador</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width:'100%', padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, justifyContent:'center', transition:'background .12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Inyección de media queries — afecta a .adm-* en toda la página */}
      <style>{`
        @media (min-width: 768px) {
          .adm-sidebar  { display: flex   !important; }
          .adm-topbar   { display: none   !important; }
          .adm-drawer   { display: none   !important; }
          .adm-overlay  { display: none   !important; }
          .adm-main     { padding-top: 28px !important; }
        }
        @media (max-width: 767px) {
          .adm-sidebar  { display: none   !important; }
          .adm-topbar   { display: flex   !important; }
          .adm-main     { padding-top: 76px !important; }
        }
      `}</style>

      {/* ── DESKTOP sidebar (sticky) ── */}
      <aside className="adm-sidebar"
        style={{ width:W, flexShrink:0, background:'var(--card)', borderRight:'1px solid var(--border)', height:'100dvh', position:'sticky', top:0, flexDirection:'column', overflow:'hidden' }}>
        <NavContent/>
      </aside>

      {/* ── MOBILE: barra superior fija ── */}
      <div className="adm-topbar"
        style={{ display:'none', position:'fixed', top:0, left:0, right:0, height:52, zIndex:160, background:'var(--card)', borderBottom:'1px solid var(--border)', alignItems:'center', justifyContent:'space-between', padding:'0 16px' }}>
        <Logo size={18}/>
        <button onClick={() => setOpen(v => !v)}
          style={{ background:'transparent', border:'none', fontSize:22, cursor:'pointer', color:'var(--text)', padding:'4px 8px', lineHeight:1 }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* ── MOBILE: overlay oscuro ── */}
      {open && (
        <div className="adm-overlay"
          onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:161 }}/>
      )}

      {/* ── MOBILE: drawer deslizable ── */}
      <div className="adm-drawer"
        style={{ display:'flex', position:'fixed', top:0, left:0, bottom:0, width:260, zIndex:162, background:'var(--card)', flexDirection:'column', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition:'transform .25s ease', borderRight:'1px solid var(--border)' }}>
        <NavContent/>
      </div>
    </>
  );
}
