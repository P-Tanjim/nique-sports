import { Clock, ShoppingBag, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react';

const STAT_CONFIG = [
  { key: 'revenue', label: 'Total Revenue', icon: Wallet, tone: 'bg-primary-soft text-primary' },
  { key: 'orders', label: 'Total Orders', icon: ShoppingBag, tone: 'bg-surface-blue text-primary-dark' },
  { key: 'customers', label: 'New Customers', icon: Users, tone: 'bg-accent/15 text-primary-dark' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: Clock, tone: 'bg-warning/10 text-warning' },
];

// Server Component. `stats` is a plain object keyed by STAT_CONFIG's `key`,
// shaped like { revenue: { value, change, trend }, ... }. `trend` is the
// semantic meaning ('positive' | 'negative'), while the arrow shown is read
// straight off the `change` string — that's what lets "-2 today" on Pending
// Orders still render green, since fewer pending orders is good news.
export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {STAT_CONFIG.map(({ key, label, icon: Icon, tone }) => {
        const stat = stats[key] ?? {};

        return (
          <div
            key={key}
            className="min-w-0 rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(32,36,38,0.04)]"
          >
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
                <Icon size={18} strokeWidth={1.8} />
              </span>

              {stat.change && (
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    stat.trend === 'positive'
                      ? 'bg-success/10 text-success'
                      : stat.trend === 'negative'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-surface text-text-muted'
                  }`}
                >
                  {stat.change.startsWith('+') && <TrendingUp size={12} />}
                  {stat.change.startsWith('-') && <TrendingDown size={12} />}
                  {stat.change}
                </span>
              )}
            </div>

            <p className="mt-4 wrap-break-word text-2xl font-semibold text-text sm:text-3xl">{stat.value ?? '—'}</p>
            <p className="mt-1 text-xs font-medium text-text-muted sm:text-sm">{label}</p>
          </div>
        );
      })}
    </div>
  );
}