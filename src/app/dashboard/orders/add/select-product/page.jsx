import { requireStaff } from '@/lib/admin/guard';
import { getProducts } from '@/lib/api/products/products';
import SelectProductClient from '@/components/dashboard/orders/SelectProductClient';

export const metadata = {
  title: 'Select Product | Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function SelectProductPage() {
  await requireStaff();
  const result = await getProducts(1000);
  const products = Array.isArray(result) ? result : [];

  return <SelectProductClient products={products} />;
}
