import { Review } from '@/lib/firestore/reviews';

const FALLBACK: Review[] = [
  { id:'1', name:'Francisca M.', stars:5, text:'El sándwich mechada italiano queso es lo mejor que he probado. Siempre vuelvo.', sortOrder:0, visible:true },
  { id:'2', name:'Rodrigo V.',   stars:5, text:'Pedí el burrito con carne y elegí mis toppings, llegó perfecto. Atención excelente.', sortOrder:1, visible:true },
  { id:'3', name:'Carolina T.',  stars:5, text:'Las salchipapas son enormes para el precio. Muy buena relación calidad-precio.', sortOrder:2, visible:true },
  { id:'4', name:'Sebastián P.', stars:5, text:'Rapidísimos por WhatsApp, el pedido llegó completo y caliente. 100% recomendado.', sortOrder:3, visible:true },
];

export default function Reviews({ items = [] }: { items?: Review[] }) {
  const visible = items.filter(r => r.visible);
  const data    = visible.length > 0 ? visible : FALLBACK;

  return (
    <section className="reviews-section" style={{ padding:'60px 0', background:'var(--bg2)' }}>
      <div className="reviews-wrap" style={{ maxWidth:'var(--max)', margin:'0 auto', padding:'0 20px' }}>
        <div className="reviews-head" style={{ textAlign:'center', marginBottom:28 }}>
          <div>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'var(--orange)', textTransform:'uppercase' }}>Testimonios</span>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginTop:6 }}>Lo que dicen nuestros clientes</h2>
          </div>
          <div className="reviews-rating-block" style={{ display:'none', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:64, color:'var(--orange)', lineHeight:1 }}>4.9</div>
            <div style={{ color:'var(--yellow)', fontSize:20, letterSpacing:2 }}>★★★★★</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>532 reseñas en Google</div>
          </div>
        </div>
        <div className="reviews-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {data.map(r => (
            <div key={r.id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px' }}>
              <div style={{ fontSize:14, color:'#f59e0b', marginBottom:8, letterSpacing:1 }}>
                {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
              </div>
              <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.6, marginBottom:12, fontStyle:'italic' }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>{r.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
