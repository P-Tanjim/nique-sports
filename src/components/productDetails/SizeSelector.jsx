'use client';

// Client Component, but purely presentational — PurchasePanel owns the
// actual selectedSize state and passes it down, so this file has no state
// of its own and stays trivial to reuse elsewhere if you need it later.
export default function SizeSelector({ sizes, selectedSize, onSelect, onOpenSizeChart }) {
  const list = sizes ?? [];

  if (!list.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Size</span>
        <button
          type="button"
          onClick={onOpenSizeChart}
          className="cursor-pointer text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Size guide
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((size) => {
          const isActive = size === selectedSize;
          return (
            <button
              key={size}
              type="button"
              onClick={() => onSelect(size)}
              aria-pressed={isActive}
              className={`flex h-10 min-w-14 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-text hover:border-primary/40'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}