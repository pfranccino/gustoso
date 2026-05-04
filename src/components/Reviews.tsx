const reviews = [
  { name:'Francisca M.', stars:5, text:'El sándwich mechada italiano queso es lo mejor que he probado. Siempre vuelvo.' },
  { name:'Rodrigo V.',    stars:5, text:'Pedí el burrito con carne y elegí mis toppings, llegó perfecto. Atención excelente.' },
  { name:'Carolina T.',   stars:5, text:'Las salchipapas son enormes para el precio. Muy buena relación calidad-precio.' },
  { name:'Sebastián P.',  stars:5, text:'Rapidísimos por WhatsApp, el pedido llegó completo y caliente. 100% recomendado.' },
];

export default function Reviews() {
  return (
    <section style={{ padding:'60px 0', background:'var(--bg2)' }}>
      <div style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Testimonios</span>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginTop:6 }}>Lo que dicen nuestros clientes</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px' }}>
              <div className="stars" style={{ fontSize:13, marginBottom:8 }}>{'★'.repeat(r.stars)}</div>
              <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.6, marginBottom:12, fontStyle:'italic' }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>{r.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
