export default function SectionDivider({ num, label }: { num: number; label: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'40px 20px 8px', maxWidth:'var(--max)', margin:'0 auto' }}>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:64, color:'var(--orange)', lineHeight:.8, letterSpacing:-2 }}>
        {String(num).padStart(2,'0')}
      </span>
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}
