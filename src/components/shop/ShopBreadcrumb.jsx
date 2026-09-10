import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Server Component — static markup, no client JS shipped for this at all.
export default function ShopBreadcrumb({ page = 1 }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-muted">
      <Link href="/" className="transition-colors hover:text-primary">
        Home
      </Link>
      <ChevronRight size={14} className="text-border" />
      <Link href="/shop" className="transition-colors hover:text-primary">
        Shop
      </Link>
      {page > 1 && (
        <>
          <ChevronRight size={14} className="text-border" />
          <span className="text-text">Page {page}</span>
        </>
      )}
    </nav>
  );
}