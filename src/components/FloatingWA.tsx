'use client';

import { useCart } from '@/contexts/CartContext';
import { WA_NUMBER } from '@/lib/menuData';
import { WAIcon } from './icons';

export default function FloatingWA() {
  const { count } = useCart();
  if (count > 0) return null;
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hola Gustoso's, quiero hacer un pedido 🌭")}`;
  return (
    <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ position:'fixed', bottom:24, right:20, zIndex:200, width:54, height:54, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 18px rgba(37,211,102,0.5)', textDecoration:'none' }}>
      <div style={{ position:'absolute', width:'100%', height:'100%', borderRadius:'50%', background:'rgba(37,211,102,0.35)', animation:'pulse-ring 2s ease-out infinite' }}></div>
      <WAIcon size={26} color="#fff"/>
    </a>
  );
}
