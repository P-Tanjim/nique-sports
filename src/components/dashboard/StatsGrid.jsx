import Link from 'next/link';
import { Banknote, Clock, ShoppingBag, Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/format';

// One bordered strip divided into four cells (instead of four separate cards).
// The two cells that lead somewhere are links; none of them have shadows.
export default function StatsGrid({ stats, range }) {
  const items = [
    { label: `Orders, last ${range} days`, value: stats.orders, icon: ShoppingBag },
    { label: 'Waiting for action', value: stats.pending, icon: Clock, href: '/dashboard/orders' },
    { label: `Delivered revenue, ${range} days`, value: `${formatPrice(stats.deliveredRevenue)}৳`, icon: Banknote },
    { label: 'Total balance', value: `${formatPrice(stats.balance)}৳`, icon: Wallet, href: '/dashboard/finance' },
  ];

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, href }, index) => {
        const Tag = href ? Link : 'div';
        const props = href ? { href } : {};

        return (
          <Tag
            key={label}
            {...props}
            className={`flex min-w-0 flex-col gap-4 p-5 transition-colors ${
              href ? 'hover:bg-surface' : ''
            } ${index % 2 === 1 ? 'border-l border-border' : ''} ${
              index >= 2 ? 'border-t border-border lg:border-t-0' : ''
            } ${index > 0 ? 'lg:border-l' : ''}`}
          >
            <Icon size={18} strokeWidth={1.7} className="text-text-muted" />
            <div className="min-w-0">
              <p className="truncate text-2xl font-semibold tabular-nums text-text">{value}</p>
              <p className="mt-1 truncate text-xs text-text-muted">{label}</p>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
