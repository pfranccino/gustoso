export default function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, marginTop:20 }}>
      <div style={{ flex:1, height:1, background:'var(--border)' }}></div>
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:11, letterSpacing:2, color:'var(--orange)', textTransform:'uppercase' }}>{title}</span>
      <div style={{ flex:1, height:1, background:'var(--border)' }}></div>
    </div>
  );
}
