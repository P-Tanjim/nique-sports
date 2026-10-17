import { requireAdmin } from '@/lib/admin/guard';
import { getFinanceSummary, getFinanceTransactions } from '@/lib/api/requests/finance';
import { shiftDate, startOfMonthInDhaka, todayInDhaka } from '@/lib/admin/dates';
import BalanceCards from '@/components/dashboard/finance/BalanceCards';
import PeriodSummary from '@/components/dashboard/finance/PeriodSummary';
import FinanceFilters from '@/components/dashboard/finance/FinanceFilters';
import FinanceActions from '@/components/dashboard/finance/FinanceActions';
import TransactionList from '@/components/dashboard/finance/TransactionList';
import DataError from '@/components/dashboard/DataError';

export const metadata = {
  title: 'Finance | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TYPES = ['money_in', 'expense', 'transfer'];
const LEDGER_LIMIT = 200;
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export default async function FinancePage({ searchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const today = todayInDhaka();
  const monthStart = startOfMonthInDhaka();

  let from = isDate(sp?.from) ? sp.from : monthStart;
  let to = isDate(sp?.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];

  const type = TYPES.includes(sp?.type) ? sp.type : '';
  const q = typeof sp?.q === 'string' ? sp.q.trim().slice(0, 80) : '';

  const [summary, transactions] = await Promise.all([
    getFinanceSummary({ from, to }),
    getFinanceTransactions({ from, to, type, q, limit: LEDGER_LIMIT }),
  ]);

  if (!summary || !transactions) return <DataError />;

  const presetRanges = [
    { label: 'Today', from: today, to: today },
    { label: 'This month', from: monthStart, to: today },
    { label: 'Last 30 days', from: shiftDate(today, -29), to: today },
    { label: 'All time', from: '2000-01-01', to: today },
  ];
  const presets = presetRanges.map((range) => ({
    label: range.label,
    href: `/dashboard/finance?from=${range.from}&to=${range.to}`,
    active: range.from === from && range.to === to && !type && !q,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Finance</h1>
          <p className="mt-1 text-sm text-text-muted">Balances and cash flow across your four accounts.</p>
        </div>
        <FinanceActions today={today} opening={summary.opening} />
      </header>

      <BalanceCards balances={summary.balances} />
      <PeriodSummary period={summary.period} from={from} to={to} />
      <FinanceFilters from={from} to={to} type={type} q={q} presets={presets} />
      <TransactionList transactions={transactions} limit={LEDGER_LIMIT} />
    </div>
  );
}
