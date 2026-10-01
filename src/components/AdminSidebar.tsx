'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { LayoutDashboard, UtensilsCrossed, Beef, Gift, ClipboardList, Route, Tag, Droplets, Coins, Leaf, Camera, Star, Sprout, Settings, LogOut, Menu, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: 'Operaciones',
    items: [
      { href: '/admin/orders',    label: 'Pedidos',    icon: ClipboardList },
      { href: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/menu',        label: 'Menú',         icon: UtensilsCrossed },
      { href: '/admin/burrito',     label: 'Burrito',      icon: Beef },
      { href: '/admin/promotions',  label: 'Promos',       icon: Gift },
      { href: '/admin/discounts',   label: 'Descuentos',   icon: Tag },
      { href: '/admin/aderezos',    label: 'Aderezos',     icon: Droplets },
      { href: '/admin/ingredients', label: 'Ingredientes', icon: Leaf },
    ],
  },
  {
    label: 'Negocios',
    items: [
      { href: '/admin/costs', label: 'Costos', icon: Coins },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/admin/gallery', label: 'Galería',  icon: Camera },
      { href: '/admin/reviews', label: 'Reseñas',  icon: Star },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/settings', label: 'Config',    icon: Settings },
      { href: '/admin/routes',   label: 'Rutas',     icon: Route },
      { href: '/admin/seed',     label: 'Seed',      icon: Sprout },
    ],
  },
];

const W = 220; // sidebar width px

export default function AdminSidebar({ email }: { email: string }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open, setOpen] = useState(false);

  // Live pending badge
  const { orders: allOrders } = useLiveOrders(null);
  const pendingCount = allOrders.filter(o => o.status === 'pending').length;

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
      <div style={{ padding:'18px 16px 16px', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
        <Logo size={20}/>
      </div>

      {/* Grupos */}
      <nav style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom:2 }}>
            <div style={{ padding:'10px 16px 4px', fontSize:10, fontWeight:800, color:'var(--ink-500)', letterSpacing:1.2, textTransform:'uppercase' }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const active  = pathname === item.href;
              const isPedidos = item.href === '/admin/orders';
              const badge = isPedidos && pendingCount > 0 ? pendingCount : 0;
              return (
                <button key={item.href} onClick={() => router.push(item.href)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'9px 16px', border:'none', cursor:'pointer', textAlign:'left',
                    transition:'background .12s, color .12s',
                    borderLeft: active ? '3px solid var(--brand)' : '3px solid transparent',
                    background:  active ? 'var(--brand-soft)' : 'transparent',
                    color:       active ? 'var(--brand)' : 'var(--ink-500)',
                    fontFamily: "'Barlow Condensed',sans-serif",
                    fontWeight: active ? 800 : 600,
                    fontSize: 14,
                  }}>
                  <item.icon size={16} style={{ flexShrink:0 }}/>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {badge > 0 && (
                    <span style={{ minWidth:18, height:18, borderRadius:999, background:'var(--brand)', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px', flexShrink:0 }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: perfil + logout */}
      <div style={{ borderTop:'1px solid var(--line)', padding:'12px 16px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'6px 10px', background:'var(--surface-sunken)', borderRadius:8, border:'1px solid var(--line)' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:13, fontWeight:900, color:'#fff' }}>
            {(email || 'A')[0].toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-900)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {email || 'Admin'}
            </div>
            <div style={{ fontSize:10, color:'var(--ink-500)' }}>Administrador</div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ width:'100%', padding:'7px 12px', borderRadius:8, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, justifyContent:'center', transition:'background .12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-sunken)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <LogOut size={14}/> Cerrar sesión
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
          .adm-main     { padding: 68px 14px 40px !important; max-width: 100% !important; }
        }
      `}</style>

      {/* ── DESKTOP sidebar (sticky) ── */}
      <aside className="adm-sidebar"
        style={{ width:W, flexShrink:0, background:'var(--surface-raised)', borderRight:'1px solid var(--line)', height:'100dvh', position:'sticky', top:0, flexDirection:'column', overflow:'hidden' }}>
        <NavContent/>
      </aside>

      {/* ── MOBILE: barra superior fija ── */}
      <div className="adm-topbar"
        style={{ display:'none', position:'fixed', top:0, left:0, right:0, height:52, zIndex:160, background:'var(--surface-raised)', borderBottom:'1px solid var(--line)', alignItems:'center', justifyContent:'space-between', padding:'0 16px' }}>
        <Logo size={18}/>
        <button onClick={() => setOpen(v => !v)}
          style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--ink-900)', padding:'4px 8px', lineHeight:1, display:'flex' }}>
          {open ? <X size={22}/> : <Menu size={22}/>}
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
        style={{ display:'flex', position:'fixed', top:0, left:0, bottom:0, width:260, zIndex:162, background:'var(--surface-raised)', flexDirection:'column', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition:'transform .25s ease', borderRight:'1px solid var(--line)' }}>
        <NavContent/>
      </div>
    </>
  );
}
