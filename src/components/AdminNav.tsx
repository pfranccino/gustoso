'use client';

import { useRouter, usePathname } from 'next/navigation';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard',    emoji: '📊' },
  { href: '/admin/menu',       label: 'Menú',         emoji: '🍔' },
  { href: '/admin/burrito',    label: 'Burrito',      emoji: '🌯' },
  { href: '/admin/promotions', label: 'Promos',       emoji: '🎁' },
  { href: '/admin/orders',     label: 'Pedidos',      emoji: '📋' },
  { href: '/admin/routes',     label: 'Rutas',        emoji: '🗺️' },
  { href: '/admin/discounts',  label: 'Descuentos',   emoji: '🏷' },
  { href: '/admin/settings',   label: 'Configuración',emoji: '⚙️' },
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
    <nav style={{ background:'var(--card)', borderBottom:'1px solid var(--border)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
      <Logo size={22}/>

      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:999, border: active ? '2px solid var(--orange)' : '2px solid transparent', background: active ? 'rgba(242,100,25,0.1)' : 'transparent', color: active ? 'var(--orange)' : 'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' }}>
              <span>{item.emoji}</span>{item.label}
            </button>
          );
        })}
      </div>

      <button onClick={handleLogout} style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', background:'transparent', border:'1px solid var(--border)', borderRadius:999, padding:'5px 12px', cursor:'pointer' }}>
        Cerrar sesión
      </button>
    </nav>
  );
}
