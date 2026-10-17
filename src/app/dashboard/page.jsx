import { requireAdmin } from '@/lib/admin/guard';
import { getDashboardOverview } from '@/lib/api/requests/dashboard';
import { formatToday } from '@/lib/admin/dates';
import StatsGrid from '@/components/dashboard/StatsGrid';
import OrdersChart from '@/components/dashboard/OrdersChart';
import LowStock from '@/components/dashboard/LowStock';
import RecentOrders from '@/components/dashboard/RecentOrders';
import DataError from '@/components/dashboard/DataError';

export const metadata = {
  title: 'Overview | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

// Admin data changes constantly, and the page depends on who is signed in.
export const dynamic = 'force-dynamic';

const RANGES = [7, 14, 30];

export default async function DashboardPage({ searchParams }) {
  await requireAdmin();

  const sp = await searchParams;
  const requested = Number(sp?.range);
  const range = RANGES.includes(requested) ? requested : 14;

  const overview = await getDashboardOverview(range);
  if (!overview) return <DataError />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-text-muted">{formatToday()}</p>
      </header>

      <StatsGrid stats={overview.stats} range={range} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <OrdersChart data={overview.chart} range={range} />
        <LowStock lowStock={overview.lowStock} />
      </div>

      <RecentOrders orders={overview.recentOrders} />
    </div>
  );
}
