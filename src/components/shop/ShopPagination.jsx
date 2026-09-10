import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function buildHref(baseParams, page) {
  const params = new URLSearchParams();
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 'all' && value !== '') {
      params.set(key, String(value));
    }
  });
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
}

// Server Component — plain <Link>s, so Next.js prefetches every page number
// on hover/viewport and there's zero client JS cost for pagination itself.
export default function ShopPagination({ currentPage, totalPages, baseParams }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Shop pagination" className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={buildHref(baseParams, Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-text-muted transition-colors ${
          currentPage === 1 ? 'pointer-events-none opacity-30' : 'hover:border-primary/30 hover:text-primary'
        }`}
      >
        <ChevronLeft size={16} />
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(baseParams, p)}
          aria-current={p === currentPage ? 'page' : undefined}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
            p === currentPage
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-white text-text-muted hover:border-primary/30 hover:text-primary'
          }`}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref(baseParams, Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-text-muted transition-colors ${
          currentPage === totalPages ? 'pointer-events-none opacity-30' : 'hover:border-primary/30 hover:text-primary'
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}