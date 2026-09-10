import ProductGridSkeleton from '@/components/shop/ProductGridSkeleton';

// Next.js shows this automatically while /shop's page.js (and its top-level
// awaits) is still resolving — first visit or a hard navigation. In-page
// filter/sort/page changes don't retrigger this; those are handled by the
// keyed <Suspense> inside page.js, which only re-suspends the product grid.
export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-350 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="h-4 w-40 animate-pulse rounded bg-border/70" />

        <div className="mt-6 flex gap-10">
          <aside className="hidden w-72 shrink-0 space-y-6 lg:block">
            <div className="h-64 animate-pulse rounded-3xl border border-border bg-white" />
            <div className="h-40 animate-pulse rounded-3xl border border-border bg-white" />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="h-10 w-32 animate-pulse rounded bg-border/70" />
              <div className="h-9 w-40 animate-pulse rounded-xl bg-border/50" />
            </div>
            <div className="mt-8">
              <ProductGridSkeleton count={12} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}