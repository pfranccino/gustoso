export default function Gallery() {
  const slots = ['Sándwich Churrasco','Burrito Gustoso','Salchipapas','Sándwich Mechada'];
  return (
    <section style={{ padding:'60px 0', background:'var(--bg2)' }}>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Galería</span>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginTop:6 }}>Nuestros platos</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {slots.map((s, i) => (
            <div key={i} style={{ aspectRatio:'4/3', background:'var(--bg3)', borderRadius:'var(--radius)', border:'1px dashed var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(45deg,rgba(242,100,25,0.04) 0px,rgba(242,100,25,0.04) 1px,transparent 1px,transparent 10px)' }}></div>
              <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'0 10px' }}>
                <div style={{ fontSize:24, marginBottom:4 }}>📷</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, fontFamily:'monospace' }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
