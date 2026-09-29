export default function SectionDivider({ label }: { label: string }) {
  return (
    <div className="section-divider-wrap" style={{ display:'flex', alignItems:'center', gap:16, padding:'40px 20px 8px', maxWidth:'var(--max)', margin:'0 auto' }}>
      <div style={{ flex:1, height:1, background:'var(--line)' }}/>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--ink-500)', letterSpacing:2, textTransform:'uppercase' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--line)' }}/>
    </div>
  );
}
