export default function About() {
  return (
    <section id="nosotros" className="about-section" style={{ padding:'60px 20px' }}>
      <div className="about-inner" style={{ display:'block' }}>

        {/* Photo stack — desktop only */}
        <div className="about-photo-stack" style={{ display:'none', position:'relative', height:360 }}>
          <div style={{ position:'absolute', top:0, right:16, width:'82%', height:290, borderRadius:'var(--r-md)', background:'linear-gradient(135deg,var(--surface-3),var(--surface-2))', border:'1px solid var(--line)' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, width:'82%', height:290, borderRadius:'var(--r-md)', background:'linear-gradient(135deg,var(--brand-500),var(--brand-700))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 40px rgba(242,100,25,0.3)' }}>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:48, color:'#fff', letterSpacing:1 }}>Gustoso&apos;s</span>
          </div>
          <span style={{ position:'absolute', left:12, top:12, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 10px', borderRadius:5, fontSize:10, letterSpacing:.8, fontWeight:700 }}>Desde 2019</span>
        </div>

        {/* Text content */}
        <div className="about-text" style={{ textAlign:'center' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:36, color:'var(--ink-900)', margin:'0 0 18px', lineHeight:1 }}>La calidad <span style={{ color:'var(--brand-500)' }}>va en el gusto</span></h2>
          <p style={{ fontSize:16, color:'var(--ink-500)', lineHeight:1.7, maxWidth:460, margin:'0 auto 16px' }}>En Gustoso&apos;s creemos que comer rico no debería ser complicado. Desde nuestros jugosos sándwiches hasta nuestros burritos armados a tu gusto, cada pedido se prepara con ingredientes frescos y mucho cariño.</p>
          <p style={{ fontSize:16, color:'var(--ink-500)', lineHeight:1.7, maxWidth:460, margin:'0 auto 28px' }}>Somos un local comprometido con entregar sabor real — sin atajos, sin ingredientes de relleno.</p>
          <div className="about-values" style={{ display:'flex', flexDirection:'column', gap:12, textAlign:'left' }}>
            {[
              { title:'Ingredientes frescos a diario', desc:'Compramos local cada mañana. Nada congelado, nada del día anterior.' },
              { title:'Tu Burrito armado a tu gusto', desc:'Eliges relleno, proteína (Normal o XL), toppings y salsa. Sin combos forzados.' },
              { title:'Delivery a todo Los Andes', desc:'Cálculo por distancia, tarifa transparente antes de confirmar.' },
            ].map(v => (
              <div key={v.title} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px', background:'var(--surface-0)', borderRadius:'var(--r-sm)', border:'1px solid var(--line)' }}>
                <div style={{ width:6, minHeight:36, borderRadius:3, background:'var(--brand-500)', flexShrink:0, marginTop:2 }}/>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:'var(--ink-900)', marginBottom:3 }}>{v.title}</div>
                  <div style={{ fontSize:13, color:'var(--ink-500)', lineHeight:1.55 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
