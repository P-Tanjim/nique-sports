import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import OrderStatusBadge from '../../../../src/components/dashboard/OrderStatusBadge';
import { formatPrice } from '@/lib/format';
import { formatOrderDate } from '@/lib/admin/dates';

export default function RecentOrders({ orders }) {
  return (
    <section className="rounded-2xl border border-border bg-white">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-text">Recent orders</h2>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          View all
          <ChevronRight size={14} />
        </Link>
      </header>

      {orders.length === 0 ? (
        <p className="border-t border-border px-5 py-10 text-center text-sm text-text-muted">
          No orders yet. New orders will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center gap-4 px-5 py-3.5">
              <OrderStatusBadge status={order.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{order.customer || 'Customer'}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted">
                  {order.orderId}, {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'},{' '}
                  {formatOrderDate(order.createdAt)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
                {formatPrice(order.total)}৳
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
