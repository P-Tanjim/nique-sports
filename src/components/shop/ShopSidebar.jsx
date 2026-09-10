import CategoryList from './CategoryList';
import PriceFilter from './PriceFilter';

// Server Component. Mixes another Server Component (CategoryList) with a
// Client Component (PriceFilter) directly — that direction is always fine;
// it's only Client → Server that needs the props/slot pattern used in
// MobileFilterDrawer.
export default function ShopSidebar({ categories, activeCategory, priceBounds }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-24 space-y-6">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
          <h2 className="mb-4 text-lg font-semibold text-text">Categories</h2>
          <CategoryList categories={categories} activeCategory={activeCategory} />
        </div>

        <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
          <h2 className="mb-4 text-lg font-semibold text-text">Filter By Price</h2>
          <PriceFilter min={priceBounds.min} max={priceBounds.max} />
        </div>
      </div>
    </aside>
  );
}