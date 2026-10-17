import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { formatLedgerDate } from '@/lib/admin/dates';

export default function PeriodSummary({ period, from, to }) {
  return (
    <section className="rounded-2xl border border-border bg-white">
      <header className="px-5 py-4">
        <h2 className="text-sm font-semibold text-text">Cash flow</h2>
        <p className="mt-0.5 text-xs text-text-muted">
          {formatLedgerDate(from)} to {formatLedgerDate(to)}
        </p>
      </header>

      <div className="grid grid-cols-3 border-t border-border">
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-primary">
            <ArrowDownLeft size={16} strokeWidth={1.8} />
            <span className="text-xs text-text-muted">Money in</span>
          </div>
          <p className="mt-2 truncate text-lg font-semibold tabular-nums text-text sm:text-xl">
            {formatPrice(period.moneyIn)}৳
          </p>
        </div>
        <div className="border-l border-border p-5">
          <div className="flex items-center gap-1.5 text-text-muted">
            <ArrowUpRight size={16} strokeWidth={1.8} />
            <span className="text-xs">Expenses</span>
          </div>
          <p className="mt-2 truncate text-lg font-semibold tabular-nums text-text sm:text-xl">
            {formatPrice(period.expense)}৳
          </p>
        </div>
        <div className="border-l border-border p-5">
          <span className="text-xs text-text-muted">Net</span>
          <p
            className={`mt-2 truncate text-lg font-semibold tabular-nums sm:text-xl ${
              period.net < 0 ? 'text-danger' : 'text-text'
            }`}
          >
            {formatPrice(period.net)}৳
          </p>
        </div>
      </div>
    </section>
  );
}
