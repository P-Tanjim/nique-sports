import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// Server Component, deliberately kept free of any data dependency — it
// renders instantly in the page shell while ProductDetails is still
// suspended, same role ShopBreadcrumb plays on /shop.
export default function ProductBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-muted">
      <Link href="/" className="transition-colors hover:text-primary">
        Home
      </Link>
      <ChevronRight size={14} className="text-border" />
      <Link href="/shop" className="transition-colors hover:text-primary">
        Shop
      </Link>
      <ChevronRight size={14} className="text-border" />
      <span className="text-text">Product</span>
    </nav>
  );
}