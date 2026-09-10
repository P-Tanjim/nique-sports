'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default sorting' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest discount' },
];

// Deliberately NOT using layoutId / the `layout` prop here. The popover is a
// plain absolutely-positioned panel with its own independent mount/unmount
// animation — no shared-element transition to fight with scroll or trigger
// mispositioning.
export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = searchParams.get('sort') ?? 'default';
  const currentLabel = SORT_OPTIONS.find((o) => o.value === current)?.label ?? 'Default sorting';

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const select = useCallback(
    (value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', value);
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setOpen(false);
    },
    [pathname, router, searchParams]
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm text-text transition-colors hover:border-primary/40"
      >
        {currentLabel}
        <ChevronDown size={14} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.4 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 z-30 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-border bg-white/95 p-1.5 shadow-[0_20px_50px_rgba(32,36,38,0.12)] backdrop-blur-xl"
          >
            {SORT_OPTIONS.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === current}>
                <button
                  type="button"
                  onClick={() => select(option.value)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    option.value === current
                      ? 'bg-primary-soft text-primary'
                      : 'text-text-muted hover:bg-surface hover:text-text'
                  }`}
                >
                  {option.label}
                  {option.value === current && <Check size={14} className="text-primary" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}