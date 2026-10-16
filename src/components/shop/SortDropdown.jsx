'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default sorting' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest discount' },
];

export default function SortDropdown() {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const rootRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedSort = searchParams.get('sort') ?? 'default';
  const current = SORT_OPTIONS.some((option) => option.value === requestedSort)
    ? requestedSort
    : 'default';

  const select = useCallback(
    (value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', value);
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedIndex = SORT_OPTIONS.findIndex((option) => option.value === current);
  const indicatorIndex = hoveredIndex ?? selectedIndex;

  return (
    <div ref={rootRef} className="relative w-45 sm:w-56">
      <button
        type="button"
        id="shop-sort"
        onClick={() => {
          setHoveredIndex(selectedIndex);
          setOpen((wasOpen) => !wasOpen);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-2xl bg-surface px-4 py-3 text-left text-sm text-text outline-none transition-colors focus:border-primary"
      >
        <span>{SORT_OPTIONS[selectedIndex]?.label}</span>
        <ChevronDown
          aria-hidden="true"
          size={15}
          className={`shrink-0 text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby="shop-sort"
          onMouseLeave={() => setHoveredIndex(null)}
          className="absolute left-0 right-0 z-50 mt-2 rounded-[24px] border border-white/10 bg-white p-2 shadow-2xl"
        >
          {SORT_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === current}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => {
                select(option.value);
                setOpen(false);
              }}
              className="group/item relative flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-primary-dark"
            >
              {indicatorIndex === index && (
                <span className="absolute inset-0 rounded-2xl border border-white/20 bg-primary-light/30 " />
              )}
              <span className="relative z-10 text-[#263238] transition-transform duration-200 group-hover/item:translate-x-1">
                {option.label}
              </span>
              {option.value === current && (
                <Check size={16} className="relative z-10 shrink-0 text-[#263238]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}