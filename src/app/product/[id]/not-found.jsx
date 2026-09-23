import Link from 'next/link';
import { PackageSearch } from 'lucide-react';

// Fires whenever ProductDetails calls notFound() — e.g. the slug/id doesn't
// match anything in the DB, or the product's been taken down.
export default function ProductNotFound() {
  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto flex max-w-350 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <PackageSearch size={26} strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-text">Product not found</h1>
        <p className="mt-2 max-w-sm text-sm text-text-muted">
          This jersey might have sold out for good, or the link is out of
          date. Have a look at what&apos;s currently in stock instead.
        </p>
        <Link
          href="/shop"
          className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Back to Shop
        </Link>
      </div>
    </main>
  );
}