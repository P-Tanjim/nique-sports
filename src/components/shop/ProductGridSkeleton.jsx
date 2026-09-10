// Server Component. Dimensions here deliberately mirror ProductGrid + a
// ProductCard exactly, so swapping the real grid in doesn't shift anything
// else on the page — this is what keeps CLS at zero.
export default function ProductGridSkeleton({ count = 12 }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-3xl border border-border bg-white">
            <div className="aspect-square bg-surface" />
            <div className="space-y-2 p-5">
              <div className="h-3 w-3/4 rounded bg-border/70" />
              <div className="h-3 w-1/2 rounded bg-border/70" />
              <div className="h-4 w-1/3 rounded bg-border/70" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-10 animate-pulse rounded-xl border border-border bg-white" />
        ))}
      </div>
    </>
  );
}