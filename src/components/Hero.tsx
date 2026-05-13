'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useZone } from '@/contexts/ZoneContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { fmt } from '@/lib/menuData';
import Logo from './Logo';
import { WAIcon } from './icons';
import { MenuItem } from '@/lib/firestore/menuItems';
import { DeliveryConfig } from '@/lib/firestore/settingsTypes';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcDeliveryFee(distKm: number, cfg: DeliveryConfig): number | null {
  const sorted = [...cfg.zones].sort((a, b) => a.maxKm - b.maxKm);
  const zone = sorted.find(z => distKm <= z.maxKm);
  if (zone) return zone.price;
  if (cfg.extraPricePerKm > 0 && sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    return last.price + Math.ceil(distKm - last.maxKm) * cfg.extraPricePerKm;
  }
  return null;
}

export default function Hero({ menuItems = [] }: { menuItems?: MenuItem[] }) {
  const { waNumber, isOpen, avgMinutes, openTime, delivery } = useSettings();
  const { zoneResult, setZoneResult, clearZone } = useZone();
  const { state: geo, request: requestGeo, clear: clearGeo } = useGeolocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [addrInput, setAddrInput] = useState('');
  const [addrStatus, setAddrStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [addrCoords, setAddrCoords] = useState<{ lat: number; lng: number; display: string } | null>(null);
  const [sheetZone, setSheetZone] = useState<'retiro' | 'delivery' | null>(null);

  async function geocodeAddress() {
    const q = addrInput.trim();
    if (!q) return;
    setAddrStatus('loading');
    setAddrCoords(null);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setAddrStatus('error'); return; }
      setAddrCoords({ lat: data.lat, lng: data.lng, display: data.display });
      setAddrStatus('idle');
      // Auto-select delivery if in zone
      if (delivery?.enabled && delivery.restaurantLat && delivery.restaurantLng) {
        const dist = haversineKm(delivery.restaurantLat, delivery.restaurantLng, data.lat, data.lng);
        const fee  = calcDeliveryFee(dist, delivery);
        if (fee !== null) setSheetZone('delivery');
      }
    } catch {
      setAddrStatus('error');
    }
  }

  const geoCoords = geo.status === 'success' ? { lat: geo.lat, lng: geo.lng } : null;
  const activeCoords = geoCoords ?? addrCoords ?? null;
  const distKm = activeCoords && delivery?.enabled && delivery.restaurantLat && delivery.restaurantLng
    ? haversineKm(delivery.restaurantLat, delivery.restaurantLng, activeCoords.lat, activeCoords.lng)
    : null;
  const sheetDeliveryFee = (distKm !== null && delivery)
    ? calcDeliveryFee(distKm, delivery)
    : null;

  function confirmZone() {
    if (!sheetZone) return;
    if (sheetZone === 'retiro') {
      setZoneResult({ zone: 'retiro', distKm: null, deliveryFee: 0, addrDisplay: '', activeCoords: null, locationUrl: undefined });
    } else if (sheetZone === 'delivery' && activeCoords) {
      setZoneResult({
        zone: 'delivery',
        distKm,
        deliveryFee: sheetDeliveryFee,
        addrDisplay: addrCoords?.display ?? '',
        activeCoords,
        locationUrl: addrCoords ? `https://maps.google.com/?q=${addrCoords.lat},${addrCoords.lng}` : geo.status === 'success' ? geo.locationUrl : undefined,
      });
    }
    closeSheet();
  }

  function closeSheet() {
    setSheetOpen(false);
    setAddrInput('');
    setAddrStatus('idle');
    setAddrCoords(null);
    setSheetZone(null);
    clearGeo();
  }

  // Auto-select delivery when geo arrives (inside sheet)
  useEffect(() => {
    if (geo.status === 'success' && sheetZone === null && sheetOpen) {
      setSheetZone('delivery');
    }
  }, [geo.status, sheetZone, sheetOpen]);

  /* Top 3 visible items with photos for the collage */
  const collagePhotos = menuItems.filter(m => m.visible && m.imageUrl).slice(0, 3);
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hola Gustoso's, quiero hacer un pedido 🌭")}`;

  return (
    <section className="hero-section" style={{
      position: 'relative',
      minHeight: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '88px 24px 32px',
      textAlign: 'center',
    }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,100,25,0.12) 0%, transparent 70%)' }}></div>
      {/* Mobile decorative circles — hidden on desktop */}
      <div className="hero-bg-circles" style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ position:'absolute', width:280+i*160, height:280+i*160, borderRadius:'50%', border:`1px solid rgba(242,100,25,${0.07-i*0.02})`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}></div>
        ))}
      </div>

      {/* Desktop gradient accent (top-left) */}
      <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(242,100,25,0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 90% 80%, rgba(232,163,11,0.06) 0%, transparent 60%)', pointerEvents:'none' }}></div>

      {/* Inner grid — single col on mobile, 2-col on desktop */}
      <div className="hero-inner" style={{ position:'relative', zIndex:1, maxWidth:'var(--max)', width:'100%' }}>

        {/* ── Left / main content ── */}
        <div className="hero-text" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          {/* Logo visible on mobile only */}
          <div className="hero-logo-mobile fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'center' }}>
            <Logo size={64}/>
          </div>

          {/* Desktop eyebrow */}
          <div className="hero-eyebrow fade-up" style={{ display:'none', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>Los Andes · V Región</span>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'var(--border)' }}></span>
            <span style={{ fontSize:10, fontWeight:800, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' }}>5+ años</span>
          </div>

          {/* Status pill — mobile + desktop (after eyebrow) */}
          <div className="fade-up hero-status-pill" style={{ display:'inline-flex', alignItems:'center', gap:6, background: isOpen ? 'rgba(21,128,61,0.1)' : 'rgba(107,114,128,0.1)', border:`1px solid ${isOpen ? 'rgba(21,128,61,0.25)' : 'rgba(107,114,128,0.25)'}`, borderRadius:999, padding:'5px 11px', marginBottom:8, fontSize:11, fontWeight:700, color: isOpen ? 'var(--green)' : '#6b7280', letterSpacing:.3, whiteSpace:'nowrap' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background: isOpen ? 'var(--green)' : '#9ca3af', display:'inline-block', boxShadow: isOpen ? '0 0 0 3px rgba(21,128,61,0.25)' : 'none' }}/>
            {isOpen ? `ABIERTO · ${avgMinutes} MIN` : openTime ? `CERRADO · Abre ${openTime}` : 'CERRADO'}
          </div>

          {/* Zone pill */}
          <div className="fade-up" style={{ marginBottom:16 }}>
            {zoneResult ? (
              <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <button
                  onClick={() => setSheetOpen(true)}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--card)', border:'1px solid var(--border)', borderRadius:999, padding:'5px 12px', fontSize:11, fontWeight:700, color:'var(--text)', cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  {zoneResult.zone === 'retiro'
                    ? '🏠 Retiro en local · Gratis'
                    : `📍 Delivery${zoneResult.distKm != null ? ` · ${zoneResult.distKm.toFixed(1)} km` : ''}${zoneResult.deliveryFee != null ? ` · ${fmt(zoneResult.deliveryFee)}` : ''}`}
                  <span style={{ color:'var(--text-muted)', marginLeft:2 }}>✎</span>
                </button>
                <button
                  onClick={clearZone}
                  style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', padding:'2px 4px', lineHeight:1 }}
                  title="Limpiar zona"
                >×</button>
              </div>
            ) : (
              <button
                onClick={() => setSheetOpen(true)}
                style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(242,100,25,0.07)', border:'1px dashed rgba(242,100,25,0.4)', borderRadius:999, padding:'5px 12px', fontSize:11, fontWeight:700, color:'var(--orange)', cursor:'pointer', whiteSpace:'nowrap' }}
              >
                📍 ¿A dónde llevamos?
              </button>
            )}
          </div>

          {/* Zone bottom sheet */}
          {sheetOpen && (
            <div style={{ position:'fixed', inset:0, zIndex:700, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center' }}>
              <div onClick={closeSheet} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}/>
              <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'var(--max)', background:'var(--card)', borderRadius:'var(--radius) var(--radius) 0 0', padding:'20px 20px 40px', boxShadow:'0 -8px 40px rgba(0,0,0,0.3)', animation:'slideUp .3s ease' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'var(--text)' }}>¿A dónde llevamos?</div>
                  <button onClick={closeSheet} style={{ width:30, height:30, borderRadius:'50%', border:'none', background:'var(--bg2)', cursor:'pointer', fontSize:17, color:'var(--text-muted)' }}>×</button>
                </div>

                {/* Retiro option */}
                <button
                  onClick={() => { setSheetZone('retiro'); }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:'var(--radius-sm)', border:`2px solid ${sheetZone === 'retiro' ? '#16a34a' : 'var(--border)'}`, background: sheetZone === 'retiro' ? 'rgba(22,163,74,0.08)' : 'var(--bg2)', cursor:'pointer', marginBottom:10, textAlign:'left', transition:'all .15s' }}
                >
                  <span style={{ fontSize:20 }}>🏠</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color: sheetZone === 'retiro' ? '#16a34a' : 'var(--text)' }}>Retiro en local</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>Gratis · sin espera de envío</div>
                  </div>
                </button>

                {/* Delivery — only if enabled */}
                {delivery?.enabled && (
                  <>
                    <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, marginBottom:8 }}>O ingresá tu dirección para delivery:</div>
                    <div style={{ display:'flex', gap:6, marginBottom: addrStatus === 'error' ? 4 : 10 }}>
                      <input
                        value={addrInput}
                        onChange={e => { setAddrInput(e.target.value); setAddrStatus('idle'); }}
                        onKeyDown={e => e.key === 'Enter' && geocodeAddress()}
                        placeholder="Ej: Calle Los Héroes 123"
                        style={{ flex:1, padding:'9px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none' }}
                      />
                      <button onClick={geocodeAddress} disabled={!addrInput.trim() || addrStatus === 'loading'}
                        style={{ padding:'9px 14px', borderRadius:8, border:'none', background: addrStatus === 'loading' ? '#d1bfb8' : 'var(--orange)', color:'#fff', fontSize:13, fontWeight:700, cursor: addrStatus === 'loading' ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}>
                        {addrStatus === 'loading' ? '…' : 'Buscar'}
                      </button>
                    </div>
                    {addrStatus === 'error' && <div style={{ fontSize:11, color:'#dc2626', fontWeight:600, marginBottom:8 }}>Dirección no encontrada.</div>}

                    {addrCoords && (
                      <button
                        onClick={() => setSheetZone('delivery')}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:'var(--radius-sm)', border:`2px solid ${sheetZone === 'delivery' ? 'var(--orange)' : 'var(--border)'}`, background: sheetZone === 'delivery' ? 'rgba(242,100,25,0.08)' : 'var(--bg2)', cursor:'pointer', marginBottom:10, textAlign:'left', transition:'all .15s' }}
                      >
                        <span style={{ fontSize:20 }}>🛵</span>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color: sheetZone === 'delivery' ? 'var(--orange)' : 'var(--text)' }}>
                            Delivery{distKm != null ? ` · ${distKm.toFixed(1)} km` : ''}
                          </div>
                          {sheetDeliveryFee !== null
                            ? <div style={{ fontSize:12, color:'var(--text-muted)' }}>{fmt(sheetDeliveryFee)}</div>
                            : <div style={{ fontSize:12, color:'#dc2626', fontWeight:600 }}>Fuera de zona de cobertura</div>
                          }
                        </div>
                      </button>
                    )}

                    {!addrCoords && (
                      <>
                        {geo.status === 'idle' && (
                          <button onClick={requestGeo}
                            style={{ width:'100%', padding:'10px', borderRadius:'var(--radius-sm)', border:'1.5px dashed var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:10 }}>
                            📍 O detectar mi ubicación
                          </button>
                        )}
                        {geo.status === 'loading' && (
                          <div style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', padding:'8px 0', marginBottom:10 }}>Detectando…</div>
                        )}
                      </>
                    )}
                  </>
                )}

                <button
                  onClick={confirmZone}
                  disabled={!sheetZone || (sheetZone === 'delivery' && !activeCoords)}
                  style={{ width:'100%', background: (!sheetZone || (sheetZone === 'delivery' && !activeCoords)) ? 'var(--border)' : 'var(--orange)', color: (!sheetZone || (sheetZone === 'delivery' && !activeCoords)) ? 'var(--text-muted)' : '#fff', padding:'14px', borderRadius:999, border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, cursor: (!sheetZone || (sheetZone === 'delivery' && !activeCoords)) ? 'not-allowed' : 'pointer' }}
                >
                  Confirmar →
                </button>
              </div>
            </div>
          )}

          <h1 className="fade-up-2" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:'clamp(44px,10vw,76px)', lineHeight:.95, color:'var(--text)', marginBottom:14, letterSpacing:-1 }}>
            El sabor que<br/><span style={{ color:'var(--orange)' }}>te conquista</span>
          </h1>

          <p className="fade-up-3" style={{ fontSize:17, color:'var(--text-muted)', maxWidth:480, margin:'0 auto 28px', fontWeight:500, lineHeight:1.5 }}>
            Vienesas, sándwiches, burritos y más.<br/>Hecho con sabor, entregado con gusto.
          </p>

          <div className="hero-cta fade-up-3" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:20 }}>
            <button
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior:'smooth' })}
              style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--orange)', color:'#fff', padding:'15px 30px', borderRadius:999, border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, letterSpacing:.5, cursor:'pointer', boxShadow:'0 6px 24px rgba(242,100,25,0.35)', whiteSpace:'nowrap' }}
            >
              Ver carta y pedir →
            </button>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#25D366', textDecoration:'none', fontSize:14, fontWeight:700 }}>
              <WAIcon size={16} color="#25D366"/> +56 9 8521 0940
            </a>
          </div>

          {/* Scroll hint — hidden on desktop */}
          <div className="hero-scroll-hint" style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600, letterSpacing:.5, display:'flex', alignItems:'center', gap:5, marginBottom:12 }}>
            <span>↓</span><span>Nuestra carta</span>
          </div>

          {/* Stats bar */}
          <div className="hero-stats" style={{ display:'flex', gap:0, border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)', maxWidth:360, width:'100%' }}>
            {[['5+','Años abiertos'],['500+','Clientes felices'],['30min','Tiempo promedio'],['4.9★','Rating Google']].map(([num, label], i, arr) => (
              <div key={i} style={{ flex:1, padding:'14px 8px', textAlign:'center', borderRight: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--orange)' }}>{num}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, letterSpacing:.3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right / photo collage — desktop only ── */}
        <div className="hero-collage" style={{ display:'none', position:'relative', height:480 }}>
          {/* Main circle */}
          <div style={{ position:'absolute', top:0, right:40, width:280, height:280, borderRadius:'50%', overflow:'hidden', boxShadow:'0 12px 40px rgba(60,30,10,0.18)' }}>
            {collagePhotos[0]?.imageUrl
              ? <img src={collagePhotos[0].imageUrl} alt={collagePhotos[0].name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,var(--bg2),var(--bg3))', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--orange)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, textAlign:'center', padding:24 }}>
                  {collagePhotos[0]?.name?.split(' ').slice(0,2).join(' ') ?? 'AS Italiano'}
                </div>
            }
          </div>
          {/* Small card — bottom right */}
          <div style={{ position:'absolute', bottom:60, right:0, width:180, height:180, borderRadius:20, overflow:'hidden', transform:'rotate(6deg)', boxShadow:'0 8px 24px rgba(60,30,10,0.14)' }}>
            {collagePhotos[1]?.imageUrl
              ? <img src={collagePhotos[1].imageUrl} alt={collagePhotos[1].name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,var(--bg3),var(--bg2))', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--orange)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, textAlign:'center', padding:16 }}>
                  {collagePhotos[1]?.name?.split(' ').slice(0,2).join(' ') ?? 'Burrito'}
                </div>
            }
          </div>
          {/* Small card — top left */}
          <div style={{ position:'absolute', top:40, left:0, width:150, height:150, borderRadius:18, overflow:'hidden', transform:'rotate(-8deg)', boxShadow:'0 8px 24px rgba(60,30,10,0.10)' }}>
            {collagePhotos[2]?.imageUrl
              ? <img src={collagePhotos[2].imageUrl} alt={collagePhotos[2].name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,var(--bg3),var(--bg2))', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--orange)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, textAlign:'center', padding:14 }}>
                  {collagePhotos[2]?.name?.split(' ').slice(0,2).join(' ') ?? 'Mechada XL'}
                </div>
            }
          </div>
          {/* Social proof pill */}
          <div style={{ position:'absolute', bottom:10, left:60, padding:'10px 16px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'0 4px 16px rgba(60,30,10,0.08)', display:'flex', alignItems:'center', gap:10, whiteSpace:'nowrap' }}>
            <div style={{ display:'flex', marginRight:-4 }}>
              {['M','D','C'].map((l,i) => (
                <div key={i} style={{ width:26, height:26, borderRadius:'50%', background:'var(--orange)', border:'2px solid var(--card)', marginLeft:i>0?-8:0, fontSize:10, color:'#fff', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow Condensed',sans-serif" }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:13, color:'var(--text)', lineHeight:1.2 }}>+18 pidieron hace 1h</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Entrega · 25 min</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
