import Link from 'next/link';
import { Plus } from 'lucide-react';
import ProductAdminCard from '@/components/dashboard/products/ProductAdminCard';
import { getProducts } from '@/lib/api/products/products';

export const metadata = {
  title: 'Products | Dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DashboardProductsPage() {
  const result = await getProducts(1000);
  const products = Array.isArray(result) ? result : [];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-text-muted">Manage your product catalog.</p>
        </div>
        <Link
          href="/dashboard/products/add"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          Add product
        </Link>
      </header>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const id = String(product._id ?? product.slug);
            return (
              <ProductAdminCard
                key={id}
                product={{ ...product, _id: id, slug: id }}
              />
            );
          })}
        </div>
      ) : (
        <div className="border-y border-border py-16 text-center">
          <p className="text-base font-medium text-text">No products found</p>
          <p className="mt-1 text-sm text-text-muted">Add a product to populate your catalog.</p>
        </div>
      )}
    </main>
  );
}