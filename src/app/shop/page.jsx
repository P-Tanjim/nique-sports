import { Suspense } from 'react';
import ShopBreadcrumb from '@/components/shop/ShopBreadcrumb';
import ShopSidebar from '@/components/shop/ShopSidebar';
import ShopToolbar from '@/components/shop/ShopToolbar';
import ProductGrid from '@/components/shop/ProductGrid';
import ProductGridSkeleton from '@/components/shop/ProductGridSkeleton';
import MobileFilterDrawer from '@/components/shop/MobileFilterDrawer';
import CategoryList from '@/components/shop/CategoryList';
import PriceFilter from '@/components/shop/PriceFilter';
import { getCategories, getPriceBounds } from '@/lib/products';

export const metadata = {
  title: 'Shop | NIQUE SPORTS',
  description: 'Browse BD Premium, Manufactured Retro, Player Edition Replica and Player Edition jerseys.',
};

// Fixed per your request — no "Show: 9/12/18/24" control, always 12 at a time.
const PER_PAGE = 12;

export default async function ShopPage({ searchParams }) {
  // Next 15+/16: searchParams is a Promise in Server Components.
  const sp = await searchParams;

  const category = sp.category ?? 'all';
  const minPrice = sp.minPrice;
  const maxPrice = sp.maxPrice;
  const sort = sp.sort ?? 'default';
  const page = Number(sp.page) || 1;

  // Cheap and needed immediately by both the desktop sidebar and the mobile
  // drawer, so fetched eagerly rather than behind Suspense.
  const [categories, priceBounds] = await Promise.all([getCategories(), getPriceBounds()]);

  // Re-keying the Suspense boundary on every filter/sort/page change forces
  // just this subtree to re-suspend on a client-side navigation, so the
  // sidebar and toolbar never unmount or flicker while a new page of
  // products streams in behind the skeleton.
  const suspenseKey = [category, minPrice, maxPrice, sort, page].join('|');

  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-350 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <ShopBreadcrumb page={page} />

        <div className="mt-6 flex gap-10">
          <ShopSidebar categories={categories} activeCategory={category} priceBounds={priceBounds} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">Shop</h1>

              <div className="flex items-center gap-3">
                {/* Your app already has its own bottom nav on mobile — this
                    is just the filters trigger + slide-in panel. */}
                <MobileFilterDrawer
                  categorySlot={<CategoryList categories={categories} activeCategory={category} />}
                  priceFilterSlot={<PriceFilter min={priceBounds.min} max={priceBounds.max} />}
                />
                <ShopToolbar />
              </div>
            </div>

            <div className="mt-8">
              <Suspense key={suspenseKey} fallback={<ProductGridSkeleton count={PER_PAGE} />}>
                <ProductGrid
                  category={category}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  sort={sort}
                  perPage={PER_PAGE}
                  page={page}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}