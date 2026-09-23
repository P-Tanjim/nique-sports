import Link from 'next/link';
import { Plus } from 'lucide-react';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RevenueChart from '@/components/dashboard/RevenueChart';
import RecentOrders from '@/components/dashboard/RecentOrders';
import TopProducts from '@/components/dashboard/TopProducts';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import { formatPrice } from '@/lib/format';
import {
  getDashboardStats,
  getRevenueOverview,
  getRecentOrders,
  getTopProducts,
  getLowStockProducts,
} from '@/lib/api/requests/dashboard';
import {
  DEMO_STATS,
  DEMO_REVENUE,
  DEMO_ORDERS,
  DEMO_TOP_PRODUCTS,
  DEMO_LOW_STOCK,
} from '@/lib/demo/dashboardDemoData';

export const metadata = {
  title: 'Dashboard | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

// Admin data changes constantly — never let Next cache this page.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, revenue, orders, topProducts, lowStock] = await Promise.all([
    getDashboardStats(),
    getRevenueOverview(),
    getRecentOrders(),
    getTopProducts(),
    getLowStockProducts(),
  ]);

  // Every fetch above hits a placeholder endpoint for now, so it resolves
  // to null until your Express routes exist — falls back to demo data so
  // you can see the real layout in the meantime.
  const statsData = stats ?? DEMO_STATS;
  const revenueData = revenue?.length ? revenue : DEMO_REVENUE;
  const ordersData = orders?.length ? orders : DEMO_ORDERS;
  const topProductsData = topProducts?.length ? topProducts : DEMO_TOP_PRODUCTS;
  const lowStockData = lowStock?.length ? lowStock : DEMO_LOW_STOCK;

  const weekTotal = revenueData.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <div className="space-y-6 sm:space-y-8 mx-auto">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Here's what's happening with your store today.</p>
        </div>

        {/* TODO: point at your real "add product" page once it exists */}
        <Link
          href="/dashboard/products/add"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {/* PRIORITY 1 — key numbers, glanceable at a look */}
      <StatsGrid stats={statsData} />

      {/* PRIORITY 2 — trend over time */}
      <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-text">Revenue this week</h2>
            <p className="mt-0.5 text-xs text-text-muted">Last 7 days</p>
          </div>
          <p className="text-xl font-semibold text-text sm:text-2xl">{formatPrice(weekTotal)}৳</p>
        </div>
        <div className="mt-4">
          <RevenueChart data={revenueData} />
        </div>
      </div>

      {/* PRIORITY 3 — what needs attention / action */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <RecentOrders orders={ordersData} />
        </div>
        <div className="min-w-0 space-y-6">
          <LowStockAlert products={lowStockData} />
          <TopProducts products={topProductsData} />
        </div>
      </div>
    </div>
  );
}