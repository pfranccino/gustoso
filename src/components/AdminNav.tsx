'use client';

import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';
import { LayoutDashboard, UtensilsCrossed, Beef, Gift, ClipboardList, Route, Tag, Droplets, Coins, Leaf, Camera, Star, Sprout, Settings, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/menu',       label: 'Menú',          icon: UtensilsCrossed },
  { href: '/admin/burrito',    label: 'Burrito',       icon: Beef },
  { href: '/admin/promotions', label: 'Promos',        icon: Gift },
  { href: '/admin/orders',     label: 'Pedidos',       icon: ClipboardList },
  { href: '/admin/routes',     label: 'Rutas',         icon: Route },
  { href: '/admin/discounts',  label: 'Descuentos',    icon: Tag },
  { href: '/admin/aderezos',   label: 'Aderezos',      icon: Droplets },
  { href: '/admin/costs',      label: 'Costos',        icon: Coins },
  { href: '/admin/ingredients', label: 'Ingredientes', icon: Leaf },
  { href: '/admin/gallery',    label: 'Galería',       icon: Camera },
  { href: '/admin/reviews',    label: 'Reseñas',       icon: Star },
  { href: '/admin/seed',       label: 'Seed',          icon: Sprout },
  { href: '/admin/settings',   label: 'Configuración', icon: Settings },
];

export default function AdminNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <nav style={{ background:'var(--surface-raised)', borderBottom:'1px solid var(--line)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
      <Logo size={22}/>

      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:999, border: active ? '2px solid var(--brand)' : '2px solid transparent', background: active ? 'var(--brand-soft)' : 'transparent', color: active ? 'var(--brand)' : 'var(--ink-500)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' }}>
              <item.icon size={14}/>{item.label}
            </button>
          );
        })}
      </div>

      <button onClick={handleLogout} style={{ fontSize:13, fontWeight:600, color:'var(--ink-500)', background:'transparent', border:'1px solid var(--line)', borderRadius:999, padding:'5px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
        <LogOut size={13}/> Cerrar sesión
      </button>
    </nav>
  );
}
