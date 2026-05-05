import { getOrders, Order } from '@/lib/firestore/orders';

export const dynamic = 'force-dynamic';

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function OrderRow({ order }: { order: Order }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            {formatDate(order.createdAt)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
            {order.items.map(it => `${it.qty}× ${it.name}${it.size ? ` (${it.size})` : ''}`).join(' · ')}
          </div>
          {order.locationUrl && (
            <a
              href={order.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#F26419', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
            >
              📍 Ver ubicación
            </a>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontWeight: 900, fontSize: 22,
            color: 'var(--orange)',
          }}>
            {fmt(order.total)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {order.itemCount} {order.itemCount === 1 ? 'ítem' : 'ítems'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function OrdersPage() {
  let orders: Order[] = [];
  let fetchError = false;

  try {
    orders = await getOrders(50);
  } catch {
    fetchError = true;
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: 'var(--text)', marginBottom: 4 }}>
          Pedidos
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Últimos 50 pedidos registrados.
        </p>
      </div>

      {fetchError && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 20 }}>
          Error cargando pedidos. Revisa la conexión con Firestore.
        </div>
      )}

      {orders.length === 0 && !fetchError && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            Aún no hay pedidos registrados. Aparecerán aquí cuando los clientes envíen pedidos por WhatsApp.
          </div>
        </div>
      )}

      {orders.map(order => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  );
}
