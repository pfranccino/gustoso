export default function DashboardPage() {
  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'var(--text)', marginBottom:4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize:14, color:'var(--text-muted)' }}>
          Resumen de métricas y pedidos recientes.
        </p>
      </div>

      {/* KPI placeholders — se rellenan en Fase 4 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total recaudado',  value:'—', emoji:'💰' },
          { label:'N° pedidos',       value:'—', emoji:'📦' },
          { label:'Ticket promedio',  value:'—', emoji:'📈' },
          { label:'Producto top',     value:'—', emoji:'🏆' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px 16px' }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{kpi.emoji}</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'var(--orange)', marginBottom:4 }}>{kpi.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:.5, textTransform:'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--text)', marginBottom:12 }}>Próximamente</div>
        <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.6 }}>
          Las métricas detalladas se implementan en la Fase 4. Por ahora puedes ir al Menú para importar los datos iniciales y editar precios.
        </p>
      </div>
    </div>
  );
}
