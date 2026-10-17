'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const fieldClass =
  'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary';

// Uncontrolled inputs that write to the URL on submit. The form is keyed on the
// current values, so clicking a preset link remounts it with fresh defaults.
export default function FinanceFilters({ from, to, type, q, presets }) {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ['from', 'to', 'type', 'q']) {
      const value = String(data.get(key) ?? '').trim();
      if (value) params.set(key, value);
    }

    router.replace(`/dashboard/finance?${params.toString()}`, { scroll: false });
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <form key={`${from}|${to}|${type}|${q}`} onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_1.4fr_auto]">
        <label className="block">
          <span className="mb-1.5 block text-xs text-text-muted">From</span>
          <input name="from" type="date" defaultValue={from} className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-text-muted">To</span>
          <input name="to" type="date" defaultValue={to} className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-text-muted">Type</span>
          <select name="type" defaultValue={type} className={fieldClass}>
            <option value="">All</option>
            <option value="money_in">Money in</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-text-muted">Search</span>
          <input name="q" defaultValue={q} maxLength={80} placeholder="Note or reference" className={fieldClass} />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-dark-soft sm:w-auto"
          >
            <Search size={16} />
            Apply
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {presets.map((preset) => (
          <Link
            key={preset.label}
            href={preset.href}
            replace
            scroll={false}
            className={`transition-colors ${
              preset.active ? 'font-semibold text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            {preset.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
