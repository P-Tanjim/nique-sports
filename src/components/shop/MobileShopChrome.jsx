'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, ShoppingCart, SlidersHorizontal, Store, User, X } from 'lucide-react';

// Client Component that receives already-server-rendered elements
// (CategoryList, PriceFilter) as props from page.js. This is the standard
// RSC pattern for mixing server content into a client-only shell: a Client
// Component can't *import* a Server Component directly, but it can render
// one that its Server Component parent already rendered and passed down —
// same mechanism as `children`, just as named props here since the drawer
// needs to put a heading between the two sections.
//
// The drawer itself is a plain fixed-position slide-in panel (translateX),
// not a layout/shared-element animation — same reasoning as SortDropdown.
export default function MobileShopChrome({ categorySlot, priceFilterSlot, cartCount = 0 }) {
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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0b10]/90 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 text-[11px] text-white/60">
          <Link href="/" className="flex flex-col items-center gap-1 py-2.5 transition-colors hover:text-white">
            <Menu size={18} />
            <span>Menu</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 transition-colors hover:text-white"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>

          <Link href="/shop" className="flex flex-col items-center gap-1 py-2.5 text-white">
            <Store size={18} />
            <span>Shop</span>
          </Link>

          <Link href="/cart" className="flex flex-col items-center gap-1 py-2.5 transition-colors hover:text-white">
            <span className="relative">
              <ShoppingCart size={18} />
              <span className="absolute -right-2 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-linear-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-black">
                {cartCount}
              </span>
            </span>
            <span>Cart</span>
          </Link>

          <Link
            href="/account"
            className="flex flex-col items-center gap-1 py-2.5 transition-colors hover:text-white"
          >
            <User size={18} />
            <span>My acc...</span>
          </Link>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-label="Shop filters"
              className="fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm overflow-y-auto border-l border-white/10 bg-[#0b0b10]/95 p-6 backdrop-blur-2xl lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-white/40">Close</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="mb-3 text-base font-semibold text-white/80">Categories</h3>
              {categorySlot}

              <h3 className="mb-3 mt-8 text-base font-semibold text-white/80">Filter By Price</h3>
              {priceFilterSlot}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}