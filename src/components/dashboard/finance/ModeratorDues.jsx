import { formatPrice } from '@/lib/format';

// Admin finance: what each moderator has earned, been paid and is still owed.
export default function ModeratorDues({ bills }) {
  if (!bills.length) return null;
  return (
    <section className="rounded-2xl border border-border bg-white">
      <header className="px-5 py-4">
        <h2 className="text-sm font-semibold text-text">Moderator dues</h2>
        <p className="mt-0.5 text-xs text-text-muted">Earned on delivered orders, minus what you already paid. Use &quot;Pay moderator&quot; to clear a due.</p>
      </header>
      <ul className="divide-y divide-border border-t border-border">
        {bills.map((b) => (
          <li key={b.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 sm:grid-cols-[1fr_repeat(3,110px)]">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{b.name}{!b.active && <span className="ml-2 text-xs text-text-muted">(disabled)</span>}</p>
              <p className="text-xs text-text-muted">{formatPrice(b.commission)}৳ per delivered order</p>
            </div>
            <p className={`text-right text-sm font-semibold tabular-nums sm:order-last ${b.remaining > 0 ? 'text-warning' : 'text-text-muted'}`}>Due {formatPrice(b.remaining)}৳</p>
            <p className="hidden text-right text-xs text-text-muted sm:block">Earned {formatPrice(b.earned)}৳</p>
            <p className="hidden text-right text-xs text-text-muted sm:block">Paid {formatPrice(b.paid)}৳</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
