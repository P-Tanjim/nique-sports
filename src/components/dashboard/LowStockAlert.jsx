import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

// Server Component — only renders when there's actually something to flag.
export default function LowStockAlert({ products }) {
  if (!products.length) return null;

  return (
    <div className="rounded-3xl border border-warning/25 bg-warning/5 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <TriangleAlert size={16} className="text-warning" />
        <h2 className="text-sm font-semibold text-text">Low stock — needs restocking</h2>
      </div>

      <div className="mt-3 space-y-2.5">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-text">{product.name}</span>
            <span className="shrink-0 font-semibold text-warning">{product.stock} left</span>
          </div>
        ))}
      </div>

      {/* TODO: point at your real inventory page once it exists */}
      <Link href="#" className="mt-4 inline-block text-xs font-semibold text-primary hover:text-primary-dark">
        Manage inventory →
      </Link>
    </div>
  );
}