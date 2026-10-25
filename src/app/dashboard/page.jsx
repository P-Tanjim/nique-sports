import { requireStaff } from '@/lib/admin/guard';
import { formatToday } from '@/lib/admin/dates';
import { loadDashboard } from '@/lib/views/dashboard';
import StatsGrid from '@/components/dashboard/StatsGrid';
import OrdersChartHost from '@/components/dashboard/OrdersChartHost';
import LowStock from '@/components/dashboard/LowStock';
import RecentOrders from '@/components/dashboard/RecentOrders';
import DataError from '@/components/dashboard/DataError';

export const metadata = {
  title: 'Overview | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }) {
  const user = await requireStaff();
  const sp = await searchParams;

  let data;
  try {
    data = await loadDashboard(user, sp?.range);
  } catch (error) {
    console.error('Dashboard load failed:', error);
    return <DataError />;
  }
  const isAdmin = data.role === 'admin';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-text-muted">{formatToday()}</p>
      </header>

      <StatsGrid stats={data.stats} range={data.range.days} variant={isAdmin ? 'admin' : 'moderator'} />

      {/* Moderators don't see stock */}
      <div className={isAdmin ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]' : ''}>
        <OrdersChartHost data={data.chart} range={data.range.days} />
        {isAdmin && data.lowStock && <LowStock lowStock={data.lowStock} />}
      </div>

      <RecentOrders orders={data.recentOrders} />
    </div>
  );
}
