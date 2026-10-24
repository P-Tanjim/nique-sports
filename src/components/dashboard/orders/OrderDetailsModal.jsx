'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, Check, ExternalLink, Loader2, MapPin, MessageCircle, Pencil, Phone, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderStatusBadge from '../OrderStatusBadge';
import { AdvanceBadge, CourierBadge, RiderIssueBadge } from './OrderBadges';
import { markReviewSent, resolveRiderIssue, saveRiderInfo, sendOrderToCourier } from '@/lib/api/requests/staffOrders';
import { renderTemplate, waLink } from '@/lib/orders/helpers';
import { formatPrice } from '@/lib/format';

const box = 'rounded-xl border border-border bg-white p-4';
const label = 'text-[11px] font-medium uppercase tracking-wide text-text-muted';

function Thumb({ src, alt }) {
  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-white">
      <Image src={src} alt={alt} fill sizes="48px" className="object-contain p-1" />
    </div>
  );
}

export default function OrderDetailsModal({ order, onClose, isAdmin, userId, templates, onPatch }) {
  const [busy, setBusy] = useState('');
  const [editRider, setEditRider] = useState(false);
  const [rider, setRider] = useState({ riderName: order.riderName, riderPhone: order.riderPhone, riderNote: order.riderNote });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const isOwn = order.moderatorId === userId;
  const canEdit = isAdmin || (isOwn && order.status === 'Pending');
  const hasRider = order.riderName || order.riderPhone || order.riderNote;
  const delivered = order.status === 'Delivered';
  const pending = order.status === 'Pending';

  async function act(name, fn) {
    setBusy(name);
    try { await fn(); } finally { setBusy(''); }
  }

  function openWhatsApp() {
    const vars = {
      customer_name: order.customerName, order_no: order.orderNo, cod: order.cod,
      rider_name: order.riderName, rider_phone: order.riderPhone || '—', rider_note: order.riderNote || 'delivery attempt',
      discount: templates.discount, group_link: templates.groupLink,
    };
    const text = renderTemplate(delivered ? templates.review : templates.riderAlert, vars);
    window.open(waLink(order.phone, text), '_blank', 'noopener,noreferrer');
    if (delivered && order.reviewSent !== 'YES') {
      markReviewSent(order.id).then((r) => { if (r?.success) onPatch(order.id, { reviewSent: 'YES' }); });
    }
  }

  const retryCourier = () => act('courier', async () => {
    const r = await sendOrderToCourier(order.id);
    if (!r.success) { toast.error(r.error); onPatch(order.id, { courierError: r.error }); return; }
    toast.success('Sent to Steadfast.');
    onPatch(order.id, r.patch);
  });

  const submitRider = () => act('rider', async () => {
    const r = await saveRiderInfo(order.id, rider);
    if (!r.success) return toast.error(r.error);
    onPatch(order.id, r.patch);
    setEditRider(false);
    toast.success('Rider info saved.');
  });

  const resolve = () => act('resolve', async () => {
    const r = await resolveRiderIssue(order.id);
    if (!r.success) return toast.error(r.error);
    onPatch(order.id, r.patch);
  });

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-ink/55 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="order-title" className="max-h-[calc(100dvh-24px)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl sm:max-h-[calc(100dvh-48px)]">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="order-title" className="text-lg font-semibold text-text">Order details</h2>
              <OrderStatusBadge status={order.status} showLabel />
              {order.riderIssue && <RiderIssueBadge />}
              <CourierBadge status={order.courierStatus} />
            </div>
            <p className="mt-1 truncate text-xs text-text-muted">{order.orderNo} · {order.addedBy || 'website'} · {order.source}</p>
          </div>
          <div className="flex items-center gap-1">
            {canEdit && (
              <Link href={`/dashboard/orders/${order.id}/edit`} aria-label="Edit order" className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-white hover:text-primary">
                <Pencil size={17} />
              </Link>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-text-muted hover:bg-white"><X size={19} /></button>
          </div>
        </header>

        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          {/* RIDER (top, same style as customer box) */}
          {(hasRider || (isAdmin && order.courierId)) && (
            <section>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text"><Truck size={15} />Rider</h3>
                {isAdmin && !editRider && (
                  <div className="flex items-center gap-3 text-xs font-medium">
                    {order.riderIssue && <button type="button" disabled={busy === 'resolve'} onClick={resolve} className="cursor-pointer text-primary hover:underline">Mark resolved</button>}
                    <button type="button" onClick={() => setEditRider(true)} className="cursor-pointer text-text-muted hover:text-text">Edit</button>
                  </div>
                )}
              </div>
              <div className={`mt-2 grid gap-3 sm:grid-cols-2 ${box} ${order.riderIssue ? 'border-danger/40 bg-danger/5' : ''}`}>
                {editRider ? (
                  <>
                    <input value={rider.riderName} onChange={(e) => setRider({ ...rider, riderName: e.target.value })} placeholder="Rider name" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
                    <input value={rider.riderPhone} onChange={(e) => setRider({ ...rider, riderPhone: e.target.value })} placeholder="Rider phone" inputMode="tel" className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
                    <textarea value={rider.riderNote} onChange={(e) => setRider({ ...rider, riderNote: e.target.value })} placeholder="Issue / note from the rider" rows={2} className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-2" />
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="button" onClick={submitRider} disabled={busy === 'rider'} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">{busy === 'rider' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}Save</button>
                      <button type="button" onClick={() => setEditRider(false)} className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-text-muted hover:bg-white">Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div><p className={label}>Rider name</p><p className="mt-1 text-sm text-text">{order.riderName || 'Not provided'}</p></div>
                    <div><p className={label}>Rider number</p><p className="mt-1 text-sm text-text">{order.riderPhone || 'Not provided'}</p></div>
                    <div className="sm:col-span-2"><p className={label}>Issue / note</p><p className="mt-1 whitespace-pre-wrap text-sm text-text">{order.riderNote || 'None'}{order.riderResolved === 'YES' && order.riderNote ? ' (resolved)' : ''}</p></div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* CUSTOMER */}
          <section>
            <h3 className="text-sm font-semibold text-text">Customer</h3>
            <div className={`mt-2 grid gap-3 sm:grid-cols-2 ${box}`}>
              <div><p className={label}>Name</p><p className="mt-1 text-sm font-medium text-text">{order.customerName}</p></div>
              <div>
                <p className={label}>Phone</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text"><Phone size={14} />{order.phone}</p>
                {order.phone2 && <p className="mt-1 text-xs text-text-muted">Alternate: {order.phone2}</p>}
              </div>
              <div className="sm:col-span-2">
                <p className={label}>Address</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-text"><MapPin size={14} className="mt-0.5 shrink-0" />{order.address}</p>
              </div>
              {order.note && <div className="sm:col-span-2"><p className={label}>Order note</p><p className="mt-1 whitespace-pre-wrap text-sm text-text">{order.note}</p></div>}
            </div>

            {(delivered || pending) && (
              <button type="button" onClick={openWhatsApp} className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 sm:w-auto">
                <MessageCircle size={17} />
                {delivered ? 'Tell in WhatsApp' : 'Rider alert'}
                {delivered && order.reviewSent === 'YES' && <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px]">sent before</span>}
              </button>
            )}
          </section>

          {/* PRODUCTS */}
          <section>
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-text">Products</h3><span className="text-xs text-text-muted">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span></div>
            <div className="mt-2 space-y-2">
              {order.items.map((item, i) => (
                <article key={i} className={`flex gap-3 ${box}`}>
                  {item.image ? <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface"><Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" /></div> : null}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-text">{item.title}</h4>
                    <p className="mt-0.5 text-xs text-text-muted">Qty {item.quantity ?? 1}{item.size ? ` · Size ${item.size}` : ''}{item.unitPrice != null ? ` · ${formatPrice(item.unitPrice)}৳` : ''}</p>
                    {(item.customization?.name || item.customization?.number) && <p className="mt-1 text-xs text-text-muted">Name: {item.customization.name || '-'} · No: {item.customization.number || '-'}</p>}
                    {item.note && <p className="mt-1 text-xs text-text-muted">{item.note}</p>}
                    {(item.font?.image || item.patches?.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.font?.image && <Thumb src={item.font.image} alt="Font" />}
                        {item.patches?.map((p, k) => <Thumb key={k} src={p.image} alt="Patch" />)}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* PAYMENT */}
          <section className={`space-y-1.5 text-sm ${box}`}>
            <div className="flex justify-between text-text-muted"><span>Total</span><span>{formatPrice(order.total)}৳</span></div>
            <div className="flex items-center justify-between text-text-muted"><span className="flex items-center gap-2">Advance <AdvanceBadge advance={order.advance} account={order.advanceAccount} /></span><span>{formatPrice(order.advance)}৳</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-text"><span>COD (collect)</span><span>{formatPrice(order.cod)}৳</span></div>
          </section>

          {/* COURIER */}
          <section className={`space-y-2 text-sm ${box}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text">Steadfast</h3>
              {!order.courierId && pending && (
                <button type="button" onClick={retryCourier} disabled={busy === 'courier'} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
                  {busy === 'courier' && <Loader2 size={13} className="animate-spin" />}Send to Steadfast
                </button>
              )}
            </div>
            {order.courierId ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div><p className={label}>Courier ID</p><p className="mt-1 text-text">{order.courierId}</p></div>
                <div><p className={label}>Tracking</p>{order.trackingCode ? <a href={`https://steadfast.com.bd/t/${order.trackingCode}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary hover:underline">{order.trackingCode}<ExternalLink size={12} /></a> : <p className="mt-1 text-text-muted">—</p>}</div>
                <div><p className={label}>Status</p><p className="mt-1 capitalize text-text">{String(order.courierStatus || '—').replace(/_/g, ' ')}</p></div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Not sent to the courier yet.</p>
            )}
            {order.courierError && !order.courierId && <p className="rounded-lg bg-danger/10 p-2 text-xs text-danger">{order.courierError}</p>}
          </section>

          <p className="flex items-center gap-2 text-xs text-text-muted"><CalendarDays size={14} />{order.date}{order.deliveryDate ? ` · delivered ${order.deliveryDate}` : ''}</p>
        </div>
      </section>
    </div>
  );
}
