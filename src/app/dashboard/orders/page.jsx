import OrdersClient from '@/components/dashboard/OrdersClient';
import { getAllOrders } from '@/lib/api/requests/dashboard';

export const metadata = {
  title: 'All Orders | NIQUE SPORTS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const response = await getAllOrders();
  const orders = Array.isArray(response)
    ? response
    : Array.isArray(response?.orders)
      ? response.orders
      : [];

  return <OrdersClient orders={orders} unavailable={response === null} />;
}