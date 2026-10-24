import 'server-only';
import { shiftDate } from '@/lib/admin/dates';
import { adminFetch } from '@/lib/api/core/adminCore';
import { readObjects } from '@/lib/sheets/client';
import { computeBalances, openingFrom, round2 } from '@/lib/sheets/finance';
import { visibleOrders } from '@/lib/sheets/orders';
import { toMap } from '@/lib/sheets/settings';
import { todayDhaka } from '@/lib/orders/helpers';

const labelFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function qtyOf(o) {
  try { return JSON.parse(o.itemsJson || '[]').reduce((s, i) => s + (Number(i.quantity) || 1), 0) || 1; } catch { return 1; }
}

// One sheet call (admin: orders+transactions+settings, moderator: orders only) + one stock call (admin).
export async function loadDashboard(user, rangeParam) {
  const isAdmin = user.userRole === 'admin';
  const days = [7, 14, 30].includes(Number(rangeParam)) ? Number(rangeParam) : 14;
  const today = todayDhaka();
  const startDay = shiftDate(today, -(days - 1));

  const [data, low] = await Promise.all([
    readObjects(isAdmin ? ['orders', 'transactions', 'settings'] : ['orders']),
    isAdmin ? adminFetch('/admin/low-stock?threshold=5&limit=6') : null,
  ]);

  const orders = visibleOrders(user, data.orders);
  const inRange = orders.filter((o) => o.date >= startDay && o.date <= today);

  const perDay = new Map();
  for (const o of inRange) {
    const d = perDay.get(o.date) ?? { orders: 0, revenue: 0 };
    d.orders += 1;
    if (o.status !== 'Cancelled') d.revenue += o.total;
    perDay.set(o.date, d);
  }
  const chart = Array.from({ length: days }, (_, i) => {
    const date = shiftDate(startDay, i);
    const d = perDay.get(date);
    return { date, label: labelFmt.format(new Date(`${date}T12:00:00Z`)), orders: d?.orders ?? 0, revenue: round2(d?.revenue ?? 0) };
  });

  const delivered = inRange.filter((o) => o.status === 'Delivered');
  const pending = orders.filter((o) => o.status === 'Pending').length;

  const stats = isAdmin
    ? {
        orders: inRange.length, pending, delivered: delivered.length,
        deliveredRevenue: round2(delivered.reduce((s, o) => s + o.total, 0)),
        balance: computeBalances(openingFrom(toMap(data.settings)), data.transactions).total,
      }
    : {
        orders: inRange.length, pending, delivered: delivered.length,
        earned: round2(orders.filter((o) => o.status === 'Delivered' && o.deliveryDate >= startDay && o.deliveryDate <= today).reduce((s, o) => s + o.deliveryCommission, 0)),
      };

  const recentOrders = [...orders]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6)
    .map((o) => ({ id: o.id, orderId: o.orderNo, customer: o.customerName, total: o.total, status: o.status.toLowerCase(), createdAt: o.createdAt, itemCount: qtyOf(o) }));

  return {
    role: user.userRole,
    range: { days, from: startDay, to: today },
    stats, chart, recentOrders,
    lowStock: isAdmin ? low?.data ?? { threshold: 5, total: 0, items: [] } : null,
  };
}
