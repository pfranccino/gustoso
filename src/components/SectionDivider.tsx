export default function SectionDivider({ num, label }: { num: number; label: string }) {
  return (
    <div className="section-divider-wrap" style={{ display:'flex', alignItems:'center', gap:14, padding:'40px 20px 8px', maxWidth:'var(--max)', margin:'0 auto' }}>
      <span className="section-divider-num" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:64, color:'var(--brand)', lineHeight:.8, letterSpacing:-2 }}>
        {String(num).padStart(2,'0')}
      </span>
      <div style={{ flex:1, height:1, background:'var(--line)' }}/>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--ink-500)', letterSpacing:2, textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}
