import ProductBreadcrumb from '@/components/productDetails/ProductBreadcrumb';
import ProductDetailsSkeleton from '@/components/productDetails/ProductDetailsSkeleton';

// Shown automatically by Next.js on the first hit to this route (or a hard
// navigation) while page.js is still resolving — same role as
// /shop/loading.jsx. In-page navigation between two products re-triggers
// this too, since it's a full route change rather than a query param.
export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-350 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <ProductBreadcrumb />
        <ProductDetailsSkeleton />
      </div>
    </main>
  );
}