'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { Order, OrderStatus, PaymentMethod } from '@/lib/firestore/orders';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminButton from '@/components/admin/AdminButton';
import { Clock, CheckCircle, Truck, Package, XCircle, RotateCcw, PhoneOff, FileText, Banknote, Landmark, CreditCard, Store, Smartphone, Search, SlidersHorizontal, ClipboardList, MapPin, StickyNote, Tag, Bike, Download, Moon, Sunrise, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

/* ── configuración de estados ──────────────────── */

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; dot: string; icon: LucideIcon }> = {
  pending:     { label: 'Pendiente',    color: 'var(--st-pending)',   bg: 'var(--st-pending-soft)',   dot: 'var(--st-pending)',   icon: Clock },
  confirmed:   { label: 'Confirmado',   color: 'var(--st-confirmed)', bg: 'var(--st-confirmed-soft)', dot: 'var(--st-confirmed)', icon: CheckCircle },
  on_the_way:  { label: 'En camino',    color: 'var(--st-transit)',   bg: 'var(--st-transit-soft)',   dot: 'var(--st-transit)',   icon: Truck },
  delivered:   { label: 'Entregado',    color: 'var(--st-delivered)', bg: 'var(--st-delivered-soft)', dot: 'var(--st-delivered)', icon: Package },
  rejected:    { label: 'Rechazado',    color: 'var(--st-rejected)',  bg: 'var(--st-rejected-soft)',  dot: 'var(--st-rejected)',  icon: XCircle },
  returned:    { label: 'Devuelto',     color: 'var(--st-returned)',  bg: 'var(--st-returned-soft)',  dot: 'var(--st-returned)',  icon: RotateCcw },
  no_answer:   { label: 'No contestó',  color: 'var(--st-neutral)',   bg: 'var(--st-neutral-soft)',   dot: 'var(--st-neutral)',   icon: PhoneOff },
  quote:       { label: 'Cotización',   color: 'var(--st-quote)',     bg: 'var(--st-quote-soft)',     dot: 'var(--st-quote)',     icon: FileText },
};

const ALL_STATUSES = Object.keys(STATUS_CFG) as OrderStatus[];

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
  debito:        'Débito/Crédito',
};

const PAYMENT_ICON: Record<PaymentMethod, LucideIcon> = {
  efectivo: Banknote, transferencia: Landmark, debito: CreditCard,
};

/* ── tipos de filtros ──────────────────────────── */

type Filters = {
  status:  'all' | OrderStatus;
  payment: 'all' | PaymentMethod | 'none';
  dateFrom: string;
  dateTo:   string;
};
const EMPTY_FILTERS: Filters = { status: 'all', payment: 'all', dateFrom: '', dateTo: '' };
const filtersActive = (f: Filters) =>
  f.status !== 'all' || f.payment !== 'all' || !!f.dateFrom || !!f.dateTo;

/* ── FilterChips genérico ──────────────────────── */

function FilterChips<T extends string>({ label, options, value, onChange }: {
  label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:800, color:'var(--ink-500)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {options.map(opt => {
          const sel = value === opt.id;
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)}
              style={{ padding:'5px 12px', borderRadius:999, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s',
                borderColor: sel ? 'var(--brand)' : 'var(--line)',
                background:  sel ? 'var(--brand-soft)' : 'transparent',
                color:       sel ? 'var(--brand)' : 'var(--ink-500)' }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── exportar CSV ──────────────────────────────── */

function exportCSV(orders: Order[]) {
  const BOM = '﻿';
  const headers = ['Código', 'Fecha', 'Estado', 'Método de pago', 'Productos', 'Subtotal', 'Descuento', 'Delivery', 'Total', 'Notas', 'Ubicación'];
  const rows = orders.map(o => [
    o.orderId ?? '',
    new Date(o.createdAt).toLocaleString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    STATUS_CFG[o.status].label,
    o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod].replace(/^\S+\s/, '') : 'Sin especificar',
    o.items.map(it => `${it.qty}x ${it.name}${it.size ? ` (${it.size})` : ''}`).join(' | '),
    o.discountAmount ? o.total - (o.deliveryFee ?? 0) + o.discountAmount : o.total - (o.deliveryFee ?? 0),
    o.discountCode ? `${o.discountCode} (-${o.discountAmount ?? 0})` : '',
    o.deliveryFee ?? '',
    o.total,
    (o.notes ?? []).map(n => n.text).join(' / '),
    o.locationUrl ?? '',
  ]);
  const csv = BOM + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ── NotesSection ──────────────────────────────── */

function NotesSection({ order, onAddNote }: {
  order: Order;
  onAddNote: (id: string, text: string) => Promise<void>;
}) {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const notes = order.notes ?? [];

  async function submit() {
    const t = text.trim();
    if (!t || saving) return;
    setSaving(true);
    await onAddNote(order.id, t);
    setText('');
    setSaving(false);
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return 'ahora';
    if (m < 60)  return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `hace ${h}h`;
    return new Date(iso).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit' });
  }

  return (
    <div style={{ marginTop:10 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ fontSize:12, color:'var(--ink-500)', background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:5 }}>
        <StickyNote size={12}/> {notes.length > 0 ? `${notes.length} nota${notes.length > 1 ? 's' : ''}` : 'Agregar nota'}
        <span style={{ fontSize:10, color:'var(--ink-500)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop:8 }}>
          {notes.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
              {notes.map((n, i) => (
                <div key={i} style={{ background:'var(--surface-sunken)', border:'1px solid var(--line)', borderRadius:8, padding:'8px 12px' }}>
                  <div style={{ fontSize:13, color:'var(--ink-900)', lineHeight:1.5 }}>{n.text}</div>
                  <div style={{ fontSize:11, color:'var(--ink-500)', marginTop:3 }}>{relativeTime(n.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:6 }}>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
              placeholder="Escribe una nota interna…"
              style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1.5px solid var(--line)', background:'var(--surface-raised)', color:'var(--ink-900)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none' }}
            />
            <button onClick={submit} disabled={saving || !text.trim()}
              style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--brand-strong)', color:'var(--on-brand)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: (saving || !text.trim()) ? 'not-allowed' : 'pointer', opacity: (saving || !text.trim()) ? 0.5 : 1 }}>
              {saving ? '…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── printComanda ──────────────────────────────── */

function printComanda(order: Order) {
  const time = new Date(order.createdAt).toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  const fmtCLP = (n: number) => `$${n.toLocaleString('es-CL')}`;

  const itemsHtml = order.items.map(it => {
    const extras = (it as Record<string,unknown>).choices as Array<{label:string;selected:string}>|undefined;
    const aderezos = (it as Record<string,unknown>).aderezos as Array<{name:string}>|undefined;
    let detail = '';
    if (extras?.length) detail += extras.map(c => `<div class="detail">↳ ${c.label}: ${c.selected}</div>`).join('');
    if (aderezos?.length) detail += `<div class="detail">↳ Aderezos: ${aderezos.map(a=>a.name).join(', ')}</div>`;
    return `<div class="item"><span class="qty">${it.qty}×</span><span class="name">${it.name}${it.size ? ` (${it.size})` : ''}</span><span class="price">${fmtCLP(it.price * it.qty)}</span></div>${detail}`;
  }).join('');

  const notesList = (order.notes ?? []).map(n => `<div class="note">Nota: ${n.text}</div>`).join('');
  const source = (order as Record<string,unknown>).source === 'local' ? 'Local / Mostrador' : 'WhatsApp';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comanda ${order.orderId ?? ''}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:13px;width:300px;padding:12px;color:#000}
  .center{text-align:center}
  .title{font-size:20px;font-weight:bold;letter-spacing:2px}
  .divider{border-top:1px dashed #000;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:3px 0}
  .label{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px}
  .item{display:flex;gap:6px;margin:5px 0;align-items:baseline}
  .qty{font-weight:bold;font-size:15px;min-width:24px}
  .name{flex:1;font-size:14px;font-weight:bold}
  .price{font-size:12px;color:#444}
  .detail{font-size:11px;color:#555;padding-left:30px;margin:-2px 0 4px}
  .total{font-size:18px;font-weight:bold}
  .note{font-size:12px;margin:3px 0}
  @media print{body{width:100%}button{display:none}}
</style></head><body>
<div class="center">
  <div class="title">GUSTOSO'S</div>
  <div style="font-size:11px;margin-top:2px">COMANDA DE COCINA</div>
</div>
<div class="divider"></div>
<div class="row"><span class="label">Pedido</span><span style="font-weight:bold">${order.orderId ?? '—'}</span></div>
<div class="row"><span class="label">Hora</span><span>${time}</span></div>
<div class="row"><span class="label">Origen</span><span>${source}</span></div>
<div class="divider"></div>
${itemsHtml}
<div class="divider"></div>
${order.discountCode ? `<div class="row"><span>Descuento ${order.discountCode}</span><span>-${fmtCLP(order.discountAmount??0)}</span></div>` : ''}
${order.deliveryFee ? `<div class="row"><span>Delivery</span><span>${fmtCLP(order.deliveryFee)}</span></div>` : ''}
<div class="row"><span class="label">Total</span><span class="total">${fmtCLP(order.total)}</span></div>
${order.paymentMethod ? `<div class="row"><span class="label">Pago</span><span>${PAYMENT_LABEL[order.paymentMethod]}</span></div>` : ''}
${notesList ? `<div class="divider"></div>${notesList}` : ''}
<div class="divider"></div>
<div class="center" style="font-size:11px;color:#888">Impreso ${new Date().toLocaleString('es-CL')}</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=360,height=600');
  if (w) { w.document.write(html); w.document.close(); }
}

/* ── OrderCard ─────────────────────────────────── */

function OrderCard({ order, onStatus, onAddNote }: {
  order: Order;
  onStatus: (id: string, s: OrderStatus) => Promise<void>;
  onAddNote: (id: string, text: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const change = async (s: OrderStatus) => {
    if (busy) return;
    setBusy(true);
    await onStatus(order.id, s);
    setBusy(false);
  };

  const time  = new Date(order.createdAt).toLocaleString('es-CL', { hour:'2-digit', minute:'2-digit' });
  const date  = new Date(order.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit' });
  const notes = order.notes ?? [];
  const cfg   = STATUS_CFG[order.status];
  const isNew = order.status === 'pending';

  return (
    <div style={{ background:'var(--surface-raised)', border:`1px solid ${isNew ? 'var(--line-strong)' : 'var(--line)'}`, borderRadius:'var(--radius-lg)', overflow:'hidden', animation:'slideIn 0.3s ease', position:'relative' }}>
      {/* Top accent bar for new/pending */}
      {isNew && (
        <div style={{ height:3, background:'linear-gradient(90deg,var(--brand),var(--gold))' }}/>
      )}

      <div style={{ padding:'14px 16px' }}>
        {/* Row 1: ID + badges + total */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              {order.orderId && (
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'var(--ink-900)', letterSpacing:.5 }}>
                  #{order.orderId}
                </span>
              )}
              {isNew && (
                <span style={{ fontSize:9, fontWeight:800, color:'var(--brand)', background:'var(--brand-soft)', padding:'2px 6px', borderRadius:4, letterSpacing:.8, textTransform:'uppercase' }}>NUEVO</span>
              )}
            </div>
            <div style={{ fontSize:11, color:'var(--ink-500)', fontWeight:600 }}>
              {date} · {time}
              {order.paymentMethod && <span style={{ marginLeft:8 }}>{PAYMENT_LABEL[order.paymentMethod]}</span>}
              {order.locationUrl && (
                <a href={order.locationUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft:8, color:'var(--brand)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:2 }}><MapPin size={10}/> Ubicación</a>
              )}
            </div>
          </div>
          {/* Status pill */}
          <select value={order.status} disabled={busy} onChange={e => change(e.target.value as OrderStatus)}
            style={{ padding:'4px 10px', borderRadius:999, border:`1.5px solid ${cfg.color}55`, background:cfg.bg, color:cfg.color, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:busy?'not-allowed':'pointer', outline:'none', opacity:busy?0.6:1 }}>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
        </div>

        {/* Items box */}
        <div style={{ padding:'10px 12px', background:'var(--surface-sunken)', borderRadius:8, marginBottom:10 }}>
          {order.items.map((it, j) => (
            <div key={j} style={{ fontSize:12.5, color:'var(--ink-900)', fontWeight:500, padding:'2px 0', lineHeight:1.5 }}>
              · {it.qty}× {it.name}{it.size ? ` (${it.size})` : ''}
            </div>
          ))}
        </div>

        {/* Note from client (first internal note, if any) */}
        {notes.length > 0 && (
          <div style={{ padding:'8px 10px', borderLeft:'3px solid var(--brand)', background:'var(--brand-soft)', fontSize:12, color:'var(--ink-500)', marginBottom:8, borderRadius:'0 6px 6px 0', lineHeight:1.4 }}>
            <StickyNote size={12} style={{display:'inline', verticalAlign:'middle'}}/> {notes[0].text}
          </div>
        )}

        {/* Discount badge */}
        {order.discountCode && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:800, color:'var(--st-confirmed)', background:'var(--st-confirmed-soft)', padding:'2px 8px', borderRadius:4, marginBottom:8, letterSpacing:.5 }}>
            <Tag size={10}/> {order.discountCode} (−{fmt(order.discountAmount ?? 0)})
          </div>
        )}

        {/* Bottom row: total + actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, borderTop:'1px dashed var(--line)' }}>
          <div style={{ fontSize:11, color:'var(--ink-500)' }}>
            {order.itemCount} ítem{order.itemCount !== 1 ? 's' : ''}
            {order.deliveryFee != null && <span style={{display:'inline-flex', alignItems:'center', gap:2}}> · <Bike size={11}/> {fmt(order.deliveryFee)}</span>}
          </div>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--ink-900)', letterSpacing:-.3 }}>{fmt(order.total)}</span>
        </div>

        {/* Action buttons */}
        {(() => {
          const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
            pending:    'confirmed',
            confirmed:  'on_the_way',
            on_the_way: 'delivered',
          };
          const nextStatus = NEXT_STATUS[order.status];
          return (
            <div style={{ display:'flex', gap:6, marginTop:10 }}>
              <button onClick={() => printComanda(order)}
                style={{ flex:1, padding:'7px 8px', borderRadius:6, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                <ClipboardList size={11}/> Detalle
              </button>
              {order.locationUrl ? (
                <a href={order.locationUrl} target="_blank" rel="noopener noreferrer"
                  style={{ flex:1, padding:'7px 8px', borderRadius:6, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontSize:11, fontWeight:700, cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}>
                  <MapPin size={11}/> Ubicación
                </a>
              ) : (
                <button disabled style={{ flex:1, padding:'7px 8px', borderRadius:6, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontSize:11, fontWeight:700, cursor:'not-allowed', opacity:0.4 }}>
                  <MapPin size={11}/> Ubicación
                </button>
              )}
              {nextStatus && (
                <button onClick={() => change(nextStatus)} disabled={busy}
                  style={{ flex:1, padding:'7px 8px', borderRadius:6, border:'none', background:'var(--ink-900)', color:'var(--surface-base)', fontSize:11, fontWeight:800, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:3, whiteSpace:'nowrap' }}>
                  {STATUS_CFG[nextStatus].label} →
                </button>
              )}
            </div>
          );
        })()}

        {/* Notes section (internal) */}
        <NotesSection order={order} onAddNote={onAddNote} />
      </div>
    </div>
  );
}

/* ── DaySummaryModal ───────────────────────────── */

function DaySummaryModal({ orders, dayStartedAt, onConfirm, onCancel, closing }: {
  orders: Order[];
  dayStartedAt: Date;
  onConfirm: () => void;
  onCancel: () => void;
  closing: boolean;
}) {
  const confirmed = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered');
  const totalRevenue = confirmed.reduce((s, o) => s + o.total, 0);
  const totalOrders  = orders.length;

  const payRows = (['efectivo','transferencia','debito'] as PaymentMethod[]).map(pm => ({
    label: PAYMENT_LABEL[pm],
    total: confirmed.filter(o => o.paymentMethod === pm).reduce((s, o) => s + o.total, 0),
    count: confirmed.filter(o => o.paymentMethod === pm).length,
  })).filter(r => r.count > 0);

  // Top 5 productos
  const itemCounts: Record<string, number> = {};
  confirmed.forEach(o => o.items.forEach(it => {
    const k = it.name + (it.size ? ` (${it.size})` : '');
    itemCounts[k] = (itemCounts[k] ?? 0) + it.qty;
  }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const dayLabel = dayStartedAt.toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  const pending  = orders.filter(o => o.status === 'pending').length;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background:'var(--surface-raised)', borderRadius:'var(--radius-lg)', border:'1px solid var(--line)', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto', padding:24 }}>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <Moon size={28} style={{color:'var(--ink-500)'}}/>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'var(--ink-900)', lineHeight:1 }}>Resumen del día</div>
            <div style={{ fontSize:12, color:'var(--ink-500)', marginTop:2 }}>Desde {dayLabel}</div>
          </div>
        </div>

        {/* Revenue */}
        <div style={{ background:'var(--brand-soft)', border:'1px solid var(--line)', borderRadius:10, padding:'14px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', textTransform:'uppercase', letterSpacing:.5 }}>Total recaudado</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color:'var(--brand)' }}>{fmt(totalRevenue)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', textTransform:'uppercase', letterSpacing:.5 }}>Pedidos</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--ink-900)' }}>{totalOrders}</div>
          </div>
        </div>

        {/* Desglose por método */}
        {payRows.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'var(--ink-500)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Por método de pago</div>
            {payRows.map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--line)' }}>
                <span style={{ fontSize:13, color:'var(--ink-900)' }}>{r.label} <span style={{ fontSize:11, color:'var(--ink-500)' }}>({r.count} ped.)</span></span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, color:'var(--brand)' }}>{fmt(r.total)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Top items */}
        {topItems.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'var(--ink-500)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Más vendidos hoy</div>
            {topItems.map(([name, qty]) => (
              <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--line)' }}>
                <span style={{ fontSize:13, color:'var(--ink-900)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, color:'var(--ink-500)', flexShrink:0, marginLeft:8 }}>{qty}×</span>
              </div>
            ))}
          </div>
        )}

        {pending > 0 && (
          <div style={{ background:'rgba(217,119,6,0.1)', border:'1px solid rgba(217,119,6,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#d97706', fontWeight:600 }}>
            <AlertTriangle size={14} style={{display:'inline', verticalAlign:'middle'}}/> Hay {pending} pedido{pending > 1 ? 's' : ''} pendiente{pending > 1 ? 's' : ''} sin confirmar.
          </div>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onCancel} disabled={closing}
            style={{ flex:1, padding:'10px', borderRadius:999, border:'1.5px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={closing}
            style={{ flex:2, padding:'10px', borderRadius:999, border:'none', background:'#16a34a', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor: closing ? 'not-allowed' : 'pointer', opacity: closing ? 0.6 : 1 }}>
            {closing ? 'Cerrando…' : <><Moon size={14} style={{display:'inline', verticalAlign:'middle'}}/> Confirmar cierre</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── OrdersPage ────────────────────────────────── */

export default function OrdersPage() {
  const [dayStartedAt, setDayStartedAt] = useState<Date | null>(null);
  const [dayClosedAt,  setDayClosedAt]  = useState<Date | null>(null);
  const [loadingDay,   setLoadingDay]   = useState(true);
  const [startingDay,  setStartingDay]  = useState(false);
  const [closingDay,   setClosingDay]   = useState(false);
  const [showAll,      setShowAll]      = useState(false);
  const [showDaySummary, setShowDaySummary] = useState(false);
  const [search,       setSearch]       = useState('');
  const [filters,      setFilters]      = useState<Filters>(EMPTY_FILTERS);
  const [showFilters,  setShowFilters]  = useState(false);

  const isClosed   = !!dayClosedAt && !!dayStartedAt && dayClosedAt > dayStartedAt;
  const activeFrom = showAll ? null : dayStartedAt;
  const { orders, loading } = useLiveOrders(activeFrom);

  useEffect(() => {
    fetch('/api/admin/start-day')
      .then(r => r.json())
      .then(({ startedAt, closedAt }) => {
        setDayStartedAt(startedAt ? new Date(startedAt) : null);
        setDayClosedAt(closedAt  ? new Date(closedAt)  : null);
        setLoadingDay(false);
      })
      .catch(() => setLoadingDay(false));
  }, []);

  const handleStartDay = async () => {
    const pending = orders.filter(o => o.status === 'pending');
    if (pending.length > 0 && dayStartedAt && !isClosed) {
      if (!confirm(`Hay ${pending.length} pedido(s) pendiente(s). ¿Iniciar de todas formas?`)) return;
    }
    setStartingDay(true);
    try {
      const res = await fetch('/api/admin/start-day', { method: 'POST' });
      const { startedAt } = await res.json();
      setDayStartedAt(new Date(startedAt)); setDayClosedAt(null); setShowAll(false);
    } finally { setStartingDay(false); }
  };

  const handleCloseDay = () => setShowDaySummary(true);

  const confirmCloseDay = async () => {
    setClosingDay(true);
    try {
      const res = await fetch('/api/admin/start-day', { method: 'DELETE' });
      const { closedAt } = await res.json();
      setDayClosedAt(new Date(closedAt));
      setShowDaySummary(false);
    } finally { setClosingDay(false); }
  };

  const handleStatus = useCallback(async (id: string, status: OrderStatus) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }, []);

  const handleAddNote = useCallback(async (id: string, note: string) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
  }, []);

  /* ── filtros ── */
  const q = search.trim().toLowerCase();
  const filteredOrders = orders.filter(o => {
    if (filters.status !== 'all' && o.status !== filters.status) return false;
    if (filters.payment !== 'all') {
      if (filters.payment === 'none' && o.paymentMethod)                     return false;
      if (filters.payment !== 'none' && o.paymentMethod !== filters.payment) return false;
    }
    if (filters.dateFrom && new Date(o.createdAt) < new Date(filters.dateFrom + 'T00:00:00')) return false;
    if (filters.dateTo   && new Date(o.createdAt) > new Date(filters.dateTo   + 'T23:59:59')) return false;
    if (q) return (o.orderId ?? '').toLowerCase().includes(q) || o.items.some(i => i.name.toLowerCase().includes(q));
    return true;
  });

  /* ── KPIs ── */
  const kpiByStatus = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = filteredOrders.filter(o => o.status === s).length;
    return acc;
  }, {});
  const kpiRevenue   = filteredOrders.filter(o => o.status === 'confirmed' || o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  /* ── desglose pago ── */
  const paymentBreakdown = (['efectivo', 'transferencia', 'debito'] as PaymentMethod[]).map(pm => ({
    method: pm,
    count:  filteredOrders.filter(o => o.paymentMethod === pm && (o.status === 'confirmed' || o.status === 'delivered')).length,
    total:  filteredOrders.filter(o => o.paymentMethod === pm && (o.status === 'confirmed' || o.status === 'delivered')).reduce((s, o) => s + o.total, 0),
  })).filter(p => p.count > 0);

  /* ── agrupación de lista ── */
  const showFlat = filters.status !== 'all';
  const grouped = ALL_STATUSES.reduce<Record<string, Order[]>>((acc, s) => {
    const list = filteredOrders.filter(o => o.status === s);
    if (list.length) acc[s] = list;
    return acc;
  }, {});

  const active   = filtersActive(filters);
  const dayLabel = dayStartedAt
    ? dayStartedAt.toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : null;

  return (
    <div>
      {showDaySummary && dayStartedAt && (
        <DaySummaryModal
          orders={orders}
          dayStartedAt={dayStartedAt}
          onConfirm={confirmCloseDay}
          onCancel={() => setShowDaySummary(false)}
          closing={closingDay}
        />
      )}

      <AdminHeader
        title="Pedidos"
        subtitle={`${orders.length} pedido${orders.length !== 1 ? 's' : ''} · ${orders.filter(o => o.status === 'pending').length} pendientes`}
        isLive={!loading}
        actions={<>
          <AdminButton variant="primary" size="md" onClick={() => window.open('/mostrador', '_blank')}><Store size={14}/> Mostrador</AdminButton>
          <AdminButton variant="ghost" size="md" onClick={() => exportCSV(filteredOrders)} disabled={filteredOrders.length === 0}>
            <Download size={14}/> CSV {filteredOrders.length > 0 && `(${filteredOrders.length})`}
          </AdminButton>
        </>}
      />

      {/* Controls */}
      <div style={{ marginBottom:16 }}>
        {/* Controles del día */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          {isClosed
            ? <span style={{ fontSize:13, fontWeight:700, color:'var(--st-confirmed)', background:'var(--st-confirmed-soft)', padding:'3px 10px', borderRadius:999, display:'inline-flex', alignItems:'center', gap:4 }}><Moon size={13}/> Día cerrado</span>
            : dayLabel ? <span style={{ fontSize:13, color:'var(--ink-500)', display:'inline-flex', alignItems:'center', gap:4 }}><Sunrise size={13}/> Desde {dayLabel}</span>
            : <span style={{ fontSize:13, color:'var(--ink-500)' }}>Sin día activo</span>}
          {(!dayStartedAt || isClosed) && (
            <button onClick={handleStartDay} disabled={startingDay || loadingDay}
              style={{ padding:'6px 16px', borderRadius:999, border:'none', background:'var(--brand-strong)', color:'var(--on-brand)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: startingDay?'not-allowed':'pointer', opacity: startingDay?0.6:1 }}>
              <Sunrise size={13}/> {startingDay ? 'Iniciando…' : isClosed ? 'Nuevo día' : 'Iniciar día'}
            </button>
          )}
          {dayStartedAt && !isClosed && (
            <button onClick={handleCloseDay} disabled={closingDay}
              style={{ padding:'6px 16px', borderRadius:999, border:'1.5px solid var(--st-confirmed)', background:'transparent', color:'var(--st-confirmed)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor: closingDay?'not-allowed':'pointer', opacity: closingDay?0.6:1, display:'inline-flex', alignItems:'center', gap:4 }}>
              <Moon size={13}/> {closingDay ? 'Cerrando…' : 'Cerrar día'}
            </button>
          )}
          <button onClick={() => setShowAll(v => !v)}
            style={{ padding:'6px 14px', borderRadius:999, border:'1px solid var(--line)', background:'transparent', color:'var(--ink-500)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            {showAll ? 'Ver día actual' : 'Ver histórico'}
          </button>
        </div>

        {/* Buscador + filtros */}
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ position:'relative', flex:1 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-500)', pointerEvents:'none', display:'flex' }}><Search size={14}/></span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código o producto…"
              style={{ width:'100%', padding:'9px 36px 9px 34px', borderRadius:999, border:'1px solid var(--line)', background:'var(--surface-raised)', color:'var(--ink-900)', fontSize:13, fontFamily:"'Barlow',sans-serif", outline:'none', boxSizing:'border-box' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', cursor:'pointer', fontSize:16, color:'var(--ink-500)', lineHeight:1 }}>×</button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            style={{ flexShrink:0, padding:'9px 16px', borderRadius:999, border:`1.5px solid ${active ? 'var(--brand)' : 'var(--line)'}`, background: active ? 'var(--brand-soft)' : 'transparent', color: active ? 'var(--brand)' : 'var(--ink-500)', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            <SlidersHorizontal size={13}/> Filtros{active ? ' •' : ''}
          </button>
        </div>

        {/* Panel filtros */}
        {showFilters && (
          <div style={{ marginTop:10, background:'var(--surface-raised)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <FilterChips<'all' | OrderStatus>
                label="Estado"
                options={[
                  { id:'all', label:'Todos' },
                  ...ALL_STATUSES.map(s => ({ id: s, label: STATUS_CFG[s].label })),
                ]}
                value={filters.status}
                onChange={v => setFilters(f => ({ ...f, status: v }))}
              />
              <FilterChips<'all' | PaymentMethod | 'none'>
                label="Método de pago"
                options={[
                  { id:'all',           label:'Todos' },
                  { id:'efectivo',      label:'Efectivo' },
                  { id:'transferencia', label:'Transferencia' },
                  { id:'debito',        label:'Débito/Crédito' },
                  { id:'none',          label:'Sin especificar' },
                ]}
                value={filters.payment}
                onChange={v => setFilters(f => ({ ...f, payment: v }))}
              />
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'var(--ink-500)', letterSpacing:1, textTransform:'uppercase', marginBottom:6 }}>Rango de fechas</div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--line)', background:'var(--surface-raised)', color:'var(--ink-900)', fontSize:13 }} />
                  <span style={{ fontSize:12, color:'var(--ink-500)' }}>hasta</span>
                  <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid var(--line)', background:'var(--surface-raised)', color:'var(--ink-900)', fontSize:13 }} />
                </div>
              </div>
            </div>
            {active && (
              <button onClick={() => setFilters(EMPTY_FILTERS)}
                style={{ marginTop:14, fontSize:12, fontWeight:700, color:'var(--st-rejected)', background:'transparent', border:'none', cursor:'pointer', padding:0 }}>
                × Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPIs */}
      {!loading && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8, marginBottom: paymentBreakdown.length > 0 ? 8 : 16 }}>
            {/* Recaudado (confirmados + entregados) */}
            <div style={{ gridColumn:'1/-1', background:'var(--brand-soft)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', textTransform:'uppercase', letterSpacing:.5 }}>Recaudado (confirmados + entregados)</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'var(--brand)' }}>{fmt(kpiRevenue)}</div>
            </div>
            {/* Contadores por estado */}
            {ALL_STATUSES.filter(s => kpiByStatus[s] > 0).map(s => {
              const cfg = STATUS_CFG[s];
              return (
                <div key={s} style={{ background:cfg.bg, border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'10px 14px' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:cfg.color }}>{kpiByStatus[s]}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--ink-500)', textTransform:'uppercase', letterSpacing:.5 }}>{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {paymentBreakdown.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              {paymentBreakdown.map(p => (
                <div key={p.method} style={{ flex:1, minWidth:120, background:'var(--surface-raised)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'10px 14px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--ink-500)', marginBottom:3 }}>{PAYMENT_LABEL[p.method]}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:'var(--brand)' }}>{fmt(p.total)}</div>
                  <div style={{ fontSize:11, color:'var(--ink-500)' }}>{p.count} pedido{p.count !== 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ fontSize:14, color:'var(--ink-500)', padding:'32px 0', textAlign:'center' }}>Conectando…</div>
      ) : orders.length === 0 ? (
        <div style={{ background:'var(--surface-raised)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ marginBottom:12, display:'flex', justifyContent:'center' }}><ClipboardList size={32} style={{color:'var(--ink-500)'}}/></div>
          <div style={{ fontSize:14, color:'var(--ink-500)' }}>
            {showAll ? 'No hay pedidos registrados.' : dayStartedAt ? 'No hay pedidos desde que se inició el día.' : 'Inicia el día para ver los pedidos de esta jornada.'}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ background:'var(--surface-raised)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ marginBottom:12, display:'flex', justifyContent:'center' }}><Search size={32} style={{color:'var(--ink-500)'}}/></div>
          <div style={{ fontSize:14, color:'var(--ink-500)' }}>Sin resultados para los filtros aplicados.</div>
          <button onClick={() => { setFilters(EMPTY_FILTERS); setSearch(''); }}
            style={{ marginTop:10, fontSize:13, fontWeight:700, color:'var(--brand)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline' }}>
            Limpiar filtros
          </button>
        </div>
      ) : showFlat ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:12 }}>
          {filteredOrders.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} onAddNote={handleAddNote}/>)}
        </div>
      ) : (
        Object.entries(grouped).map(([s, list]) => {
          const cfg = STATUS_CFG[s as OrderStatus];
          return (
            <div key={s} style={{ marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:cfg.color, letterSpacing:1, textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:cfg.dot, flexShrink:0 }}/>
                {cfg.label} ({list.length})
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:12 }}>
                {list.map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} onAddNote={handleAddNote}/>)}
              </div>
            </div>
          );
        })
      )}

    </div>
  );
}
