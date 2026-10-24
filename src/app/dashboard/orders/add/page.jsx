import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireStaff } from '@/lib/admin/guard';
import OrderForm from '@/components/dashboard/orders/OrderForm';
import { aiEnabled, courierEnabled, getSettings } from '@/lib/sheets/settings';
import { listAssignees } from '@/lib/services/moderators';

export const metadata = { title: 'Add Order | Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AddOrderPage() {
  const user = await requireStaff();
  const [settings, assignees] = await Promise.all([getSettings(), listAssignees(user)]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <Link href="/dashboard/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary">
          <ArrowLeft size={16} />
          Back to orders
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Add an order</h1>
        <p className="mt-1 text-sm text-text-muted">For orders that come from Facebook, Instagram, WhatsApp or phone calls.</p>
      </div>

      <OrderForm
        mode="create"
        assignees={assignees}
        defaultAssignee={user.id}
        canPickAssignee={user.userRole === 'admin'}
        aiEnabled={aiEnabled(settings)}
        courierEnabled={courierEnabled(settings)}
      />
    </div>
  );
}
