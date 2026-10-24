'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MapPin, MoreVertical, Package, Phone } from 'lucide-react';
import OrderStatusBadge from '../OrderStatusBadge';
import { AdvanceBadge, CourierBadge, RiderIssueBadge } from './OrderBadges';
import { ORDER_STATUSES } from '@/lib/orders/constants';
import { formatPrice } from '@/lib/format';

function Thumbs({ images }) {
  const shown = images.slice(0, 4);
  if (!shown.length) {
    return (
      <div className="flex aspect-square items-center justify-center bg-surface text-text-muted">
        <Package size={34} strokeWidth={1.5} />
      </div>
    );
  }
  const cols = shown.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
  return (
    <div className={`grid aspect-square overflow-hidden bg-surface ${cols}`}>
      {shown.map((src, i) => (
        <div key={`${src}-${i}`} className={`relative min-h-0 min-w-0 overflow-hidden ${shown.length === 3 && i === 0 ? 'row-span-2' : ''}`}>
          <Image src={src} alt="Ordered product" fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
          {i === 3 && images.length > 4 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-semibold text-white">+{images.length - 4}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrderCard({ order, isAdmin, saving, onSelect, onStatus }) {
  const [menu, setMenu] = useState(false);
  const images = order.items.map((i) => i.image).filter(Boolean);

  return (
    <article className="relative flex min-w-0 flex-col rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(32,36,38,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(32,36,38,0.12)]">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <OrderStatusBadge status={order.status} showLabel />
          {order.riderIssue && <RiderIssueBadge />}
        </div>

        {isAdmin && (
          <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenu(false); }}>
            <button
              type="button"
              aria-label={`Change status of ${order.orderNo}`}
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface"
            >
              <MoreVertical size={18} />
            </button>
            {menu && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-border bg-white p-1.5 shadow-xl">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving || s === order.status}
                    onClick={() => { setMenu(false); onStatus(order, s); }}
                    className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 ${s === 'Cancelled' ? 'text-danger' : 'text-text'}`}
                  >
                    Mark {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button type="button" onClick={onSelect} className="flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-b-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40">
        <Thumbs images={images} />
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold text-text">{order.customerName}</p>
            <span className="shrink-0 text-sm font-bold text-text">{formatPrice(order.cod)}৳</span>
          </div>
          {order.items.length > 0 && !images.length && <p className="line-clamp-2 text-xs text-text-muted">{order.items.map((i) => i.title).join(', ')}</p>}
          <p className="flex items-center gap-2 text-sm text-text-muted"><Phone size={14} className="shrink-0" />{order.phone}</p>
          <p className="flex items-start gap-2 text-sm leading-5 text-text-muted"><MapPin size={14} className="mt-0.5 shrink-0" /><span className="line-clamp-2">{order.address}</span></p>
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
            <CourierBadge status={order.courierStatus} />
            <AdvanceBadge advance={order.advance} account={order.advanceAccount} />
            {order.courierError && !order.courierId && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium text-danger">Not sent to courier</span>}
            <span className="ml-auto truncate text-[11px] text-text-muted">{order.addedBy || 'website'} · {order.date}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
