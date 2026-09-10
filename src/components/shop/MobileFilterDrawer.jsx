'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export default function MobileFilterDrawer({ categorySlot, priceFilterSlot }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open shop filters"
        className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm text-text transition-colors hover:border-primary/40 hover:text-primary lg:hidden"
      >
        <SlidersHorizontal size={15} />
        Filters
      </button>

      {/* BACKDROP */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-70 bg-black/30 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* DRAWER PANEL (CSS TRANSITION MATCHING MOBILENAV) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shop filters"
        className={`fixed inset-y-0 left-0 z-80 h-dvh w-[85%] max-w-sm overflow-y-auto border-r border-border bg-white p-6 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.207,0.473,0.504,0.935)] lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Filters</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        <h4 className="mb-3 text-sm font-semibold text-text-muted">Categories</h4>
        {categorySlot}

        <h4 className="mb-3 mt-8 text-sm font-semibold text-text-muted">
          Filter By Price
        </h4>
        {priceFilterSlot}
      </div>
    </>
  );
}