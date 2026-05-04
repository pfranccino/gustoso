export default function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 220 88" style={{ display: 'block' }}>
      <ellipse cx="110" cy="44" rx="106" ry="40" fill="#FFD600"/>
      <ellipse cx="110" cy="44" rx="98"  ry="33" fill="#F26419"/>
      <text x="110" y="57" textAnchor="middle" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:42, fill:'#fff', letterSpacing:1 }}>Gustoso</text>
      <text x="110" y="74" textAnchor="middle" style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:10, fill:'#FFD600', letterSpacing:2 }}>LA CALIDAD VA EN EL GUSTO</text>
    </svg>
  );
}
