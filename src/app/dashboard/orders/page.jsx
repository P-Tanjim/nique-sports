import { requireStaff } from '@/lib/admin/guard';
import OrdersClient from '@/components/dashboard/OrdersClient';
import { readObjects } from '@/lib/sheets/client';
import { toPublicOrder, visibleOrders } from '@/lib/sheets/orders';
import { courierEnabled, toMap } from '@/lib/sheets/settings';

export const metadata = {
  title: 'All Orders | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const INITIAL = 200; // the newest 200 are sent to the browser; "Load all" fetches the rest

export default async function OrdersPage() {
  const user = await requireStaff();

  let orders = [];
  let settings = {};
  let unavailable = false;
  try {
    const data = await readObjects(['orders', 'settings']);
    orders = visibleOrders(user, data.orders).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    settings = toMap(data.settings);
  } catch (error) {
    console.error('Orders load failed:', error);
    unavailable = true;
  }

  return (
    <OrdersClient
      orders={orders.slice(0, INITIAL).map(toPublicOrder)}
      total={orders.length}
      unavailable={unavailable}
      isAdmin={user.userRole === 'admin'}
      userId={user.id}
      canSync={courierEnabled(settings)}
      templates={{
        review: settings['Review Template'] ?? '',
        riderAlert: settings['Rider Alert Template'] ?? '',
        groupLink: settings['Review Group Link'] ?? '',
        discount: settings['Discount Percent'] ?? 10,
      }}
    />
  );
}
