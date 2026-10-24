import { requireStaff } from '@/lib/admin/guard';
import { shiftDate, startOfMonthInDhaka, todayInDhaka } from '@/lib/admin/dates';
import { loadAdminFinance, loadModeratorFinance } from '@/lib/views/finance';
import BalanceCards from '@/components/dashboard/finance/BalanceCards';
import PeriodSummary from '@/components/dashboard/finance/PeriodSummary';
import FinanceFilters from '@/components/dashboard/finance/FinanceFilters';
import FinanceActions from '@/components/dashboard/finance/FinanceActions';
import TransactionList from '@/components/dashboard/finance/TransactionList';
import ModeratorDues from '@/components/dashboard/finance/ModeratorDues';
import ModeratorFinanceView from '@/components/dashboard/finance/ModeratorFinanceView';
import DataError from '@/components/dashboard/DataError';

export const metadata = { title: 'Finance | NIQUE SPORTS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const TYPES = ['money_in', 'expense', 'transfer', 'moderator_payment'];
const LEDGER_LIMIT = 200;
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function FinancePage({ searchParams }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const today = todayInDhaka();
  const monthStart = startOfMonthInDhaka();

  let from = isDate(sp?.from) ? sp.from : monthStart;
  let to = isDate(sp?.to) ? sp.to : today;
  if (from > to) [from, to] = [to, from];

  const presetRanges = [
    { label: 'Today', from: today, to: today },
    { label: 'This month', from: monthStart, to: today },
    { label: 'Last 30 days', from: shiftDate(today, -29), to: today },
    { label: 'All time', from: '2000-01-01', to: today },
  ];

  /* ---------------- moderator: only their own earnings (date filter only) ---------------- */
  if (user.userRole !== 'admin') {
    let data;
    try {
      data = await loadModeratorFinance(user, { from, to });
    } catch (error) {
      console.error('Moderator finance failed:', error);
      return <DataError />;
    }
    const presets = presetRanges.map((r) => ({
      label: r.label,
      href: `/dashboard/finance?from=${r.from}&to=${r.to}`,
      active: r.from === from && r.to === to,
    }));
    return <ModeratorFinanceView data={data} from={from} to={to} presets={presets} />;
  }

  /* ---------------- admin ---------------- */
  const type = TYPES.includes(sp?.type) ? sp.type : '';
  const q = typeof sp?.q === 'string' ? sp.q.trim().slice(0, 80) : '';

  let data;
  try {
    data = await loadAdminFinance({ from, to, type, q, limit: LEDGER_LIMIT });
  } catch (error) {
    console.error('Finance load failed:', error);
    return <DataError />;
  }

  const presets = presetRanges.map((r) => ({
    label: r.label,
    href: `/dashboard/finance?from=${r.from}&to=${r.to}`,
    active: r.from === from && r.to === to && !type && !q,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Finance</h1>
          <p className="mt-1 text-sm text-text-muted">Balances and cash flow across your four accounts.</p>
        </div>
        <FinanceActions today={today} opening={data.summary.opening} moderators={data.bills} />
      </header>

      <BalanceCards balances={data.summary.balances} />
      <PeriodSummary period={data.summary.period} from={from} to={to} />
      <ModeratorDues bills={data.bills} />
      <FinanceFilters from={from} to={to} type={type} q={q} presets={presets} />
      <TransactionList transactions={data.transactions} limit={LEDGER_LIMIT} />
    </div>
  );
}
