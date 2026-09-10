import { getProducts } from '@/lib/products';
import ProductCard from './ProductCard';
import ShopPagination from './ShopPagination';

// Async Server Component. This is the one piece of the page that actually
// awaits the (slow, simulated-450ms) data fetch — everything else in
// page.js renders instantly around it thanks to the Suspense boundary.
export default async function ProductGrid({ category, minPrice, maxPrice, sort, perPage, page }) {
  const { items, totalPages, page: safePage } = await getProducts({
    category,
    minPrice,
    maxPrice,
    sort,
    perPage,
    page,
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-white py-24 text-center">
        <p className="text-lg font-medium text-text">No products match these filters</p>
        <p className="mt-1 text-sm text-text-muted">
          Try widening your price range or choosing a different category.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
        {items.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index < 4} index={index} />
        ))}
      </div>

      <ShopPagination
        currentPage={safePage}
        totalPages={totalPages}
        baseParams={{ category, minPrice, maxPrice, sort }}
      />
    </>
  );
}