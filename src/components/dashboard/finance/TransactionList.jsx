import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ReceiptText, UserCheck } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { formatLedgerDate } from '@/lib/admin/dates';
import DeleteTransactionButton from './DeleteTransactionButton';

const TYPE_META = {
  money_in: { icon: ArrowDownLeft, label: 'Money in', sign: '+', iconClass: 'text-primary', amountClass: 'text-primary' },
  expense: { icon: ArrowUpRight, label: 'Expense', sign: '-', iconClass: 'text-text-muted', amountClass: 'text-text' },
  transfer: { icon: ArrowLeftRight, label: 'Transfer', sign: '', iconClass: 'text-text-muted', amountClass: 'text-text-muted' },
  moderator_payment: { icon: UserCheck, label: 'Moderator payment', sign: '-', iconClass: 'text-text-muted', amountClass: 'text-text' },
};

function accountsLabel(t) {
  if (t.type === 'money_in') return `to ${t.to}`;
  if (t.type === 'expense' || t.type === 'moderator_payment') return `from ${t.from}`;
  return `${t.from} to ${t.to}`;
}

export default function TransactionList({ transactions, limit }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-14 text-center">
        <ReceiptText size={22} strokeWidth={1.5} className="text-text-muted" />
        <h2 className="mt-3 text-sm font-semibold text-text">No entries for these filters</h2>
        <p className="mt-1 text-sm text-text-muted">Widen the dates or add money in, an expense or a transfer.</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-text">Ledger</h2>
        <p className="text-xs text-text-muted">{transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}</p>
      </header>

      <ul className="divide-y divide-border border-t border-border">
        {transactions.map((t) => {
          const meta = TYPE_META[t.type] ?? TYPE_META.transfer;
          const Icon = meta.icon;
          const title = t.note || t.reference || meta.label;
          // for moderator payments / order advances the reference is an internal id, don't show it
          const showRef = t.note && t.reference && t.type === 'money_in' && !/^Order Advance/.test(t.note);

          return (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
              <span title={meta.label} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border ${meta.iconClass}`}>
                <Icon size={16} strokeWidth={1.8} />
                <span className="sr-only">{meta.label}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{title}</p>
                <p className="mt-0.5 truncate text-xs text-text-muted">
                  {formatLedgerDate(t.date)}, {accountsLabel(t)}
                  {showRef ? `, ref ${t.reference}` : ''}
                </p>
              </div>
              <p className={`shrink-0 text-sm font-semibold tabular-nums ${meta.amountClass}`}>
                {meta.sign}
                {formatPrice(t.amount)}৳
              </p>
              <DeleteTransactionButton id={t.id} />
            </li>
          );
        })}
      </ul>

      {transactions.length >= limit && (
        <p className="border-t border-border px-5 py-3 text-xs text-text-muted">Showing the latest {limit}. Narrow the dates to see older entries.</p>
      )}
    </section>
  );
}
