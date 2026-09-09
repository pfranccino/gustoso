export default function About() {
  return (
    <section id="nosotros" className="about-section" style={{ padding:'60px 20px' }}>
      <div className="about-inner" style={{ display:'block' }}>

        {/* Photo stack — desktop only */}
        <div className="about-photo-stack" style={{ display:'none', position:'relative', height:360 }}>
          <div style={{ position:'absolute', top:0, right:16, width:'82%', height:290, borderRadius:'var(--radius)', background:'linear-gradient(135deg,var(--bg3),var(--bg2))', border:'1px solid var(--border)' }}/>
          <div style={{ position:'absolute', bottom:0, left:0, width:'82%', height:290, borderRadius:'var(--radius)', background:'linear-gradient(135deg,var(--orange),var(--orange-dark))', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 40px rgba(242,100,25,0.3)' }}>
            <span style={{ fontSize:80 }}>🌭</span>
          </div>
          <span style={{ position:'absolute', left:12, top:12, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 10px', borderRadius:5, fontSize:10, letterSpacing:.8, fontWeight:700 }}>Desde 2019</span>
        </div>

        {/* Text content */}
        <div className="about-text" style={{ textAlign:'center' }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Quiénes somos</span>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, color:'var(--text)', margin:'8px 0 18px', lineHeight:1 }}>La calidad <span style={{ color:'var(--orange)' }}>va en el gusto</span></h2>
          <p style={{ fontSize:16, color:'var(--text-muted)', lineHeight:1.7, maxWidth:460, margin:'0 auto 16px' }}>En Gustoso&apos;s creemos que comer rico no debería ser complicado. Desde nuestros jugosos sándwiches hasta nuestros burritos armados a tu gusto, cada pedido se prepara con ingredientes frescos y mucho cariño.</p>
          <p style={{ fontSize:16, color:'var(--text-muted)', lineHeight:1.7, maxWidth:460, margin:'0 auto 28px' }}>Somos un local comprometido con entregar sabor real — sin atajos, sin ingredientes de relleno.</p>
          <div className="about-values" style={{ display:'none', flexDirection:'column', gap:12, textAlign:'left' }}>
            {[
              { icon:'🥬', title:'Ingredientes frescos a diario', desc:'Compramos local cada mañana. Nada congelado, nada del día anterior.' },
              { icon:'🌯', title:'Tu Burrito armado a tu gusto', desc:'Eliges relleno, proteína (Normal o XL), toppings y salsa. Sin combos forzados.' },
              { icon:'🛵', title:'Delivery a todo Los Andes', desc:'Cálculo por distancia, tarifa transparente antes de confirmar.' },
            ].map(v => (
              <div key={v.title} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 16px', background:'var(--card)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{v.icon}</span>
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--text)', marginBottom:3 }}>{v.title}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.55 }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
