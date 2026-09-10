import SortDropdown from './SortDropdown';

// Server Component — SortDropdown is the only interactive piece here, so
// this wrapper doesn't need 'use client' itself. Kept as its own file/name
// as a home for anything else you add to this row later (a result count,
// a view toggle, etc.) without touching page.js again.
export default function ShopToolbar() {
  return (
    <div className="flex items-center">
      <SortDropdown />
    </div>
  );
}