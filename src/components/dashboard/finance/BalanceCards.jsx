import { Banknote, Landmark, Smartphone, Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const ACCOUNTS = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'bkash', label: 'bKash', icon: Smartphone },
  { key: 'nagad', label: 'Nagad', icon: Wallet },
];

const amountClass = (value) => (value < 0 ? 'text-danger' : 'text-text');

// The one dark panel on the page is the total; the four accounts stay plain.
export default function BalanceCards({ balances }) {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-[1.25fr_repeat(4,1fr)]">
      <div className="bg-ink p-5 text-white">
        <p className="text-xs text-white/60">Total balance</p>
        <p className="mt-3 text-3xl font-semibold tabular-nums">{formatPrice(balances.total)}৳</p>
      </div>

      <div className="grid grid-cols-2 lg:contents">
        {ACCOUNTS.map(({ key, label, icon: Icon }, index) => (
          <div
            key={key}
            className={`p-5 ${index % 2 === 1 ? 'border-l border-border' : ''} ${
              index >= 2 ? 'border-t border-border' : ''
            } lg:border-t-0 lg:border-l`}
          >
            <div className="flex items-center gap-2 text-text-muted">
              <Icon size={16} strokeWidth={1.7} />
              <span className="text-xs">{label}</span>
            </div>
            <p className={`mt-3 text-xl font-semibold tabular-nums ${amountClass(balances[key])}`}>
              {formatPrice(balances[key])}৳
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
