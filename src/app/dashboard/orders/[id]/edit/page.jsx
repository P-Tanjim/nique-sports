import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireStaff } from '@/lib/admin/guard';
import OrderForm from '@/components/dashboard/orders/OrderForm';
import { canEditOrder, readOrders, toPublicOrder } from '@/lib/sheets/orders';
import { courierEnabled, getSettings } from '@/lib/sheets/settings';
import { listAssignees } from '@/lib/services/moderators';

export const metadata = { title: 'Edit Order | Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function EditOrderPage({ params }) {
  const user = await requireStaff();
  const { id } = await params;

  const [orders, settings, assignees] = await Promise.all([readOrders(), getSettings(), listAssignees(user)]);
  const raw = orders.find((o) => o.id === id);
  // moderators: only their own, only while Pending -> everything else is a 404
  if (!raw || !canEditOrder(user, raw)) notFound();
  const order = toPublicOrder(raw);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <Link href="/dashboard/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary">
          <ArrowLeft size={16} />
          Back to orders
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Edit order</h1>
        <p className="mt-1 text-sm text-text-muted">{order.orderNo}</p>
      </div>

      <OrderForm
        mode="edit"
        order={order}
        assignees={assignees}
        defaultAssignee={order.moderatorId || user.id}
        canPickAssignee={user.userRole === 'admin'}
        aiEnabled={false}
        courierEnabled={courierEnabled(settings)}
      />
    </div>
  );
}
