import { formatPrice } from '@/lib/format';

// Server Component — static ranked list, no interactivity needed.
export default function TopProducts({ products }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-6">
      <h2 className="text-base font-semibold text-text">Top Selling Products</h2>

      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No sales data yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{product.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {product.category} · {product.sold} sold
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-text">
                {formatPrice(product.revenue)}৳
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}