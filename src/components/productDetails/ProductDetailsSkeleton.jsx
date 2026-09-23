// Server Component. Every dimension here matches ProductDetails and its
// children exactly, the same way ProductGridSkeleton mirrors ProductGrid —
// so swapping the real content in doesn't shift anything else on the page
// (keeps CLS at zero), whether this shows via Suspense or via loading.jsx.
export default function ProductDetailsSkeleton() {
  return (
    <div className="mt-6 animate-pulse lg:grid lg:grid-cols-2 lg:gap-12">
      {/* GALLERY */}
      <div>
        <div className="aspect-square w-full rounded-3xl bg-surface" />
        <div className="mt-3 flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-16 shrink-0 rounded-xl bg-surface sm:h-20 sm:w-20" />
          ))}
        </div>
      </div>

      {/* INFO + PURCHASE PANEL + CUSTOMIZATION */}
      <div className="mt-8 space-y-6 lg:mt-0">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-border/70" />
          <div className="h-8 w-3/4 rounded bg-border/70" />
          <div className="h-6 w-28 rounded bg-border/70" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-border/50" />
          <div className="h-3 w-11/12 rounded bg-border/50" />
          <div className="h-3 w-2/3 rounded bg-border/50" />
        </div>

        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-border/70" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-14 rounded-xl bg-surface" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-border/70" />
          <div className="h-11 w-32 rounded-xl bg-surface" />
        </div>

        <div className="flex gap-3">
          <div className="h-12 flex-1 rounded-xl bg-border/70" />
          <div className="h-12 flex-1 rounded-xl bg-primary/20" />
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
          <div className="h-4 w-48 rounded bg-border/50" />
          <div className="h-4 w-40 rounded bg-border/50" />
        </div>
      </div>
    </div>
  );
}