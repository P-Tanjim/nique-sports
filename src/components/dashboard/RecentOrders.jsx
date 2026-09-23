import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { formatPrice } from '@/lib/format';

// Server Component — plain list, no client interactivity needed here.
export default function RecentOrders({ orders }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">Recent Orders</h2>
        {/* TODO: point at your real orders page once it exists */}
        <Link
          href="#"
          className="flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary-dark"
        >
          View all
          <ChevronRight size={14} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No orders yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-border/70">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{order.customer}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {order.id} · {order.items} {order.items === 1 ? 'item' : 'items'} · {order.date}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-sm font-semibold text-text">{formatPrice(order.amount)}৳</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}