'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCcw, TriangleAlert } from 'lucide-react';

// Catches anything that throws while rendering this route (a bad response
// shape, a network blip, etc.) so a person never sees a blank white screen —
// just this, with a retry button, styled like the rest of the site. Next.js
// requires error.js to be a Client Component.
export default function ProductError({ error, reset }) {
  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto flex max-w-350 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
          <TriangleAlert size={26} strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-text">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-text-muted">
          We couldn&apos;t load this product right now. Give it another try,
          or head back and pick something else.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <RefreshCcw size={15} />
            Try again
          </button>
          <Link
            href="/shop"
            className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary/40 hover:text-primary"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    </main>
  );
}