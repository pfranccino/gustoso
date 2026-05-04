export default function About() {
  return (
    <section id="nosotros" style={{ padding:'60px 20px', maxWidth:'var(--max)', margin:'0 auto', textAlign:'center' }}>
      <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Quiénes somos</span>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, color:'var(--text)', margin:'8px 0 18px', lineHeight:1 }}>La calidad <span style={{ color:'var(--orange)' }}>va en el gusto</span></h2>
      <p style={{ fontSize:16, color:'var(--text-muted)', lineHeight:1.7, maxWidth:460, margin:'0 auto 16px' }}>En Gustoso&apos;s creemos que comer rico no debería ser complicado. Desde nuestros jugosos sándwiches hasta nuestros burritos armados a tu gusto, cada pedido se prepara con ingredientes frescos y mucho cariño.</p>
      <p style={{ fontSize:16, color:'var(--text-muted)', lineHeight:1.7, maxWidth:460, margin:'0 auto' }}>Somos un local comprometido con entregar sabor real — sin atajos, sin ingredientes de relleno.</p>
    </section>
  );
}
