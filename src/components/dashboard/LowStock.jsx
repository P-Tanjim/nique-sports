import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, TriangleAlert } from 'lucide-react';

// Products at or below the backend's low-stock threshold. Out of stock shows
// a warning icon; everything else just shows the count left. Each row opens
// the product's edit page so restocking is one tap.
export default function LowStock({ lowStock }) {
  const { items, total, threshold } = lowStock;

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-white">
      <header className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-text">Running low</h2>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          Products
          <ChevronRight size={14} />
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="border-t border-border px-5 py-10 text-center text-sm text-text-muted">
          Nothing is running low right now.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((product) => (
            <li key={product.id}>
              <Link
                href={`/dashboard/products/${product.id}/edit`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="40px"
                      unoptimized={product.image.startsWith('data:')}
                      className="object-cover"
                    />
                  )}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm text-text">{product.title}</p>
                {product.stock === 0 ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-danger">
                    <TriangleAlert size={14} strokeWidth={1.8} />
                    Out
                  </span>
                ) : (
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-text">
                    {product.stock} left
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > items.length && (
        <p className="mt-auto border-t border-border px-5 py-3 text-xs text-text-muted">
          {total - items.length} more with {threshold} or fewer in stock
        </p>
      )}
    </section>
  );
}
