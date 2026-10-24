'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import DateInput from '@/components/dashboard/DateInput';
import { formatPrice } from '@/lib/format';
import { formatLedgerDate } from '@/lib/admin/dates';

function Stat({ label, value, strong }) {
  return (
    <div className="p-5">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-2 truncate text-xl font-semibold tabular-nums ${strong ? 'text-primary' : 'text-text'}`}>{value}</p>
    </div>
  );
}

// Moderator finance: own earnings + due, date filter only.
export default function ModeratorFinanceView({ data, from, to, presets }) {
  const router = useRouter();
  const [range, setRange] = useState({ from, to });
  const { summary, bill, deliveredRows, payments } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text sm:text-3xl">My earnings</h1>
        <p className="mt-1 text-sm text-text-muted">You earn on every delivered order.</p>
      </header>

      <section className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-white">
        <Stat label="Total earned" value={`${formatPrice(bill.earned)}৳`} />
        <div className="border-l border-border"><Stat label="Paid to you" value={`${formatPrice(bill.paid)}৳`} /></div>
        <div className="border-l border-border bg-primary-soft/40"><Stat label="My due" value={`${formatPrice(bill.remaining)}৳`} strong /></div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <form
          onSubmit={(e) => { e.preventDefault(); router.replace(`/dashboard/finance?from=${range.from}&to=${range.to}`, { scroll: false }); }}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <DateInput label="From" value={range.from} onChange={(v) => setRange((r) => ({ ...r, from: v }))} />
          <DateInput label="To" value={range.to} onChange={(v) => setRange((r) => ({ ...r, to: v }))} />
          <div className="flex items-end">
            <button type="submit" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark sm:w-auto"><Search size={16} />Apply</button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {presets.map((p) => (
            <Link key={p.label} href={p.href} replace scroll={false} className={p.active ? 'font-semibold text-primary' : 'text-text-muted hover:text-text'}>{p.label}</Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-white sm:grid-cols-5">
        <Stat label="Orders added" value={summary.orders} />
        <div className="border-l border-border"><Stat label="Pending" value={summary.pending} /></div>
        <div className="border-t border-border sm:border-l sm:border-t-0"><Stat label="Delivered" value={summary.delivered} /></div>
        <div className="border-l border-t border-border sm:border-t-0"><Stat label="Cancelled / returned" value={summary.cancelled} /></div>
        <div className="col-span-2 border-t border-border sm:col-span-1 sm:border-l sm:border-t-0"><Stat label="Earned in range" value={`${formatPrice(summary.earned)}৳`} strong /></div>
      </section>

      <section className="rounded-2xl border border-border bg-white">
        <header className="px-5 py-4"><h2 className="text-sm font-semibold text-text">Delivered orders</h2></header>
        {deliveredRows.length === 0 ? (
          <p className="border-t border-border px-5 py-10 text-center text-sm text-text-muted">No delivered orders in this range.</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {deliveredRows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{r.customerName}</p>
                  <p className="truncate text-xs text-text-muted">{r.orderNo} · delivered {formatLedgerDate(r.deliveryDate)}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-primary">+{formatPrice(r.commission)}৳</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {payments.length > 0 && (
        <section className="rounded-2xl border border-border bg-white">
          <header className="px-5 py-4"><h2 className="text-sm font-semibold text-text">Payments received</h2></header>
          <ul className="divide-y divide-border border-t border-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
                <span className="text-text-muted">{formatLedgerDate(p.date)} · from {p.from}</span>
                <span className="font-semibold tabular-nums text-text">{formatPrice(p.amount)}৳</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
