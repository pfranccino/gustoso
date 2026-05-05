'use client';

import { useSettings } from '@/contexts/SettingsContext';
import Logo from './Logo';

export default function Footer() {
  const { address } = useSettings();
  return (
    <footer style={{ background:'var(--bg)', borderTop:'1px solid var(--border)', padding:'24px 20px', textAlign:'center' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}><Logo size={22}/></div>
      <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>{address}</div>
      <div style={{ fontSize:12, color:'rgba(160,84,26,0.4)' }}>© 2026 Gustoso&apos;s — La Calidad Va en el Gusto</div>
    </footer>
  );
}
