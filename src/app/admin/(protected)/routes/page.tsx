'use client';

import { useState } from 'react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { Order } from '@/lib/firestore/orders';
import { useSettings } from '@/contexts/SettingsContext';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminButton from '@/components/admin/AdminButton';
import AdminCard from '@/components/admin/AdminCard';
import { parseLatLng, nearestNeighbor, buildMapsUrl, totalDistance, type LatLng } from '@/lib/routeOptimizer';
import { haversineKm } from '@/lib/geo';

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/* ── helpers ─────────────────────────────────────── */

type Stop = { order: Order } & LatLng;

const FAKE_NAMES = ['Empanada x2', 'AS Italiano', 'Vienesa Alemana', 'Burrito XL', 'Combo familiar'];

/* Coordenadas reales del local */
const RESTAURANT = { lat: -32.853987, lng: -70.594028 };

/* Límites aproximados de Los Andes, Chile */
const LOS_ANDES = { latMin: -32.870, latMax: -32.820, lngMin: -70.620, lngMax: -70.575 };

let fakeCounter = 0;

function makeFakeOrder(_origin: { lat: number; lng: number }): Order {
  fakeCounter++;
  /* punto aleatorio dentro del radio urbano de Los Andes */
  const lat = LOS_ANDES.latMin + Math.random() * (LOS_ANDES.latMax - LOS_ANDES.latMin);
  const lng = LOS_ANDES.lngMin + Math.random() * (LOS_ANDES.lngMax - LOS_ANDES.lngMin);
  const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  const qty  = Math.floor(Math.random() * 3) + 1;
  const price = (Math.floor(Math.random() * 5) + 2) * 1000;
  return {
    id:          `fake-${fakeCounter}`,
    orderId:     `TEST-${fakeCounter}`,
    createdAt:   new Date().toISOString(),
    total:       price * qty,
    itemCount:   qty,
    sessionId:   'fake',
    locationUrl: `https://maps.google.com/?q=${lat},${lng}`,
    status:      'confirmed',
    items:       [{ name, qty, price, subtotal: price * qty }],
    notes:       [],
  };
}

/* ── componente ──────────────────────────────────── */

export default function RoutesPage() {
  const { orders, loading } = useLiveOrders(null);
  const { delivery } = useSettings();
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [route,       setRoute]       = useState<Stop[] | null>(null);
  const [fakeOrders,  setFakeOrders]  = useState<Order[]>([]);

  /* solo pedidos con ubicación en estados activos */
  const deliverable = [
    ...orders.filter(o => o.locationUrl && ['pending', 'confirmed', 'on_the_way'].includes(o.status)),
    ...fakeOrders,
  ];

  /* punto de partida: coordenadas Firestore si están cargadas, sino las reales hardcodeadas */
  const restaurantOrigin =
    delivery?.restaurantLat && delivery?.restaurantLng
      ? { lat: delivery.restaurantLat, lng: delivery.restaurantLng }
      : RESTAURANT;

  /* ── paradas de prueba ── */
  const fakeOrigin = restaurantOrigin;
  function addFake() {
    const o = makeFakeOrder(fakeOrigin);
    setFakeOrders(prev => [...prev, o]);
    setRoute(null);
  }
  function clearFakes() {
    setFakeOrders([]);
    setSelected(prev => {
      const next = new Set(prev);
      fakeOrders.forEach(o => next.delete(o.id));
      return next;
    });
    setRoute(null);
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setRoute(null);
  }

  function selectAll() {
    setSelected(new Set(deliverable.map(o => o.id)));
    setRoute(null);
  }

  function calculate() {
    const stops: Stop[] = [];
    for (const id of Array.from(selected)) {
      const o = deliverable.find(x => x.id === id);
      if (!o || !o.locationUrl) continue;
      const coords = parseLatLng(o.locationUrl);
      if (!coords) continue;
      stops.push({ order: o, ...coords });
    }
    if (stops.length === 0) return;

    const origin = restaurantOrigin ?? stops[0];
    const stopsToRoute = restaurantOrigin ? stops : stops.slice(1);
    const optimized = nearestNeighbor(origin, stopsToRoute);
    if (!restaurantOrigin) optimized.unshift(stops[0]);
    setRoute(optimized);
  }

  const canCalculate = selected.size >= 1;
  const dist = route ? totalDistance(restaurantOrigin, route) : null;
  const mapsUrl = route && route.length > 0 ? buildMapsUrl(restaurantOrigin, route) : null;

  const STATUS_LABEL: Record<string, string> = {
    pending: '⏳ Pendiente', confirmed: '✅ Confirmado', on_the_way: '🛵 En camino',
  };

  return (
    <div>
      <AdminHeader
        title="Optimizar ruta"
        subtitle={route ? `${route.length} paradas · ${dist?.toFixed(1)} km estimados` : 'Selecciona pedidos y calcula el orden óptimo'}
        isLive={!!route}
        actions={<>
          {mapsUrl && (
            <AdminButton variant="primary" size="md" onClick={() => window.open(mapsUrl, '_blank')}>
              🗺️ Abrir en Google Maps
            </AdminButton>
          )}
        </>}
      />

      {/* Panel de prueba */}
      <div style={{ background: 'rgba(8,145,178,0.06)', border: '1px dashed rgba(8,145,178,0.35)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0891b2', letterSpacing: .5, textTransform: 'uppercase' }}>🧪 Modo prueba</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
          Genera paradas ficticias cerca del local para probar el algoritmo.
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addFake}
            style={{ padding: '5px 14px', borderRadius: 999, border: '1.5px solid #0891b2', background: 'transparent', color: '#0891b2', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Parada
          </button>
          {fakeOrders.length > 0 && (
            <button onClick={clearFakes}
              style={{ padding: '5px 14px', borderRadius: 999, border: '1.5px solid rgba(220,38,38,0.4)', background: 'transparent', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Limpiar ({fakeOrders.length})
            </button>
          )}
        </div>
      </div>


      {/* KPI strip — shown when route is calculated */}
      {route && dist !== null && (
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 20px', marginBottom:16, alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--orange)', lineHeight:1 }}>{dist.toFixed(1)} km</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginTop:2 }}>Distancia total</div>
          </div>
          <div style={{ width:1, height:32, background:'var(--border)', flexShrink:0 }}/>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)', lineHeight:1 }}>~{Math.round(dist * 2.5)} min</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginTop:2 }}>Tiempo estimado</div>
          </div>
          <div style={{ width:1, height:32, background:'var(--border)', flexShrink:0 }}/>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--text)', lineHeight:1 }}>{route.length}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginTop:2 }}>Parada{route.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: route ? '1fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* Panel izquierdo: selección de pedidos */}
        <div>
          {/* Controles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              {loading ? 'Cargando…' : `${deliverable.length} pedido${deliverable.length !== 1 ? 's' : ''} con ubicación`}
            </span>
            {deliverable.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={selectAll}
                  style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  Todos
                </button>
                <button onClick={() => { setSelected(new Set()); setRoute(null); }}
                  style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  Ninguno
                </button>
              </div>
            )}
          </div>

          {/* Lista */}
          {!loading && deliverable.length === 0 ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📍</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No hay pedidos activos con ubicación registrada.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deliverable.map(order => {
                const sel = selected.has(order.id);
                return (
                  <button key={order.id} onClick={() => toggle(order.id)}
                    style={{ textAlign: 'left', background: sel ? 'rgba(242,100,25,0.06)' : 'var(--card)', border: `1.5px solid ${sel ? 'var(--orange)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '12px 14px', cursor: 'pointer', transition: 'all .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Checkbox visual */}
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? 'var(--orange)' : 'var(--border)'}`, background: sel ? 'var(--orange)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {order.orderId && (
                            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14, color: order.id.startsWith('fake-') ? '#0891b2' : 'var(--orange)' }}>
                              {order.orderId}
                            </span>
                          )}
                          {order.id.startsWith('fake-')
                            ? <span style={{ fontSize: 10, fontWeight: 800, color: '#0891b2', background: 'rgba(8,145,178,0.1)', padding: '1px 6px', borderRadius: 4, letterSpacing: .5 }}>PRUEBA</span>
                            : <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{STATUS_LABEL[order.status] ?? order.status}</span>
                          }
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2, lineHeight: 1.5 }}>
                          {order.items.map(it => `${it.qty}× ${it.name}`).join(' · ')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          {fmt(order.total)} · {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Botón calcular */}
          {deliverable.length > 0 && (
            <button onClick={calculate} disabled={!canCalculate}
              style={{ marginTop: 14, width: '100%', padding: '13px', borderRadius: 999, border: 'none', background: canCalculate ? '#F26419' : '#d1bfb8', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, cursor: canCalculate ? 'pointer' : 'not-allowed', boxShadow: canCalculate ? '0 4px 16px rgba(242,100,25,0.3)' : 'none', transition: 'all .2s' }}>
              🗺 Calcular ruta óptima {selected.size > 0 && `(${selected.size})`}
            </button>
          )}
        </div>

        {/* Panel derecho: resultado */}
        {route && (
          <div>
            <AdminCard title="Orden de paradas" subtitle={dist != null ? `${dist.toFixed(1)} km estimados (línea recta)` : undefined}>
              {dist != null && false && null /* subtitle is shown in card header */}

              {/* Paradas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                {route.map((stop, i) => {
                  const isLast = i === route.length - 1;
                  const prevCoords = i === 0
                    ? (restaurantOrigin ?? stop)
                    : { lat: route[i - 1].lat, lng: route[i - 1].lng };
                  const legDist = haversineKm(prevCoords.lat, prevCoords.lng, stop.lat, stop.lng);

                  return (
                    <div key={stop.order.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: isLast ? 0 : 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14 }}>
                          {i + 1}
                        </div>
                        {!isLast && <div style={{ width: 2, height: 20, background: 'var(--border)', marginTop: 4 }}/>}
                      </div>
                      <div style={{ paddingTop: 4, flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {stop.order.orderId && (
                            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14, color: 'var(--orange)' }}>
                              {stop.order.orderId}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                            +{legDist.toFixed(1)} km
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                          {stop.order.items.map(it => `${it.qty}× ${it.name}`).join(' · ')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(stop.order.total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: '12px', borderRadius: 999, background: '#4285F4', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, textDecoration: 'none' }}>
                  🗺️ Abrir en Google Maps
                </a>
              )}
            </AdminCard>
          </div>
        )}
      </div>
    </div>
  );
}
