import Link from 'next/link';

// Server Component — plain <Link>s mean category switching works even before
// any client JS has hydrated, and Next.js prefetches these on hover/viewport.
export default function CategoryList({ categories, activeCategory = 'all' }) {
  return (
    <ul className="space-y-1">
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategory;
        const isDisabled = cat.count === 0;

        if (isDisabled) {
          return (
            <li key={cat.slug}>
              <span className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2 text-sm text-text-muted/50">
                <span>{cat.name}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">{cat.count}</span>
              </span>
            </li>
          );
        }

        return (
          <li key={cat.slug}>
            <Link
              href={`/shop?category=${cat.slug}`}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  isActive ? 'border-primary/25 text-primary' : 'border-border text-text-muted'
                }`}
              >
                {cat.count}
              </span>
            </Link>
          </li>
        );
      })}

      {activeCategory !== 'all' && (
        <li className="pt-2">
          <Link
            href="/shop"
            className="text-xs text-text-muted underline-offset-2 hover:text-primary hover:underline"
          >
            Clear category filter
          </Link>
        </li>
      )}
    </ul>
  );
}