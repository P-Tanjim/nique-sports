'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AnimatedSelect from '../dashboard/products/AnimatedSelect';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default sorting' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Biggest discount' },
];

export default function SortDropdown() {
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

  return (
    <AnimatedSelect
      id="shop-sort"
      className="w-45 sm:w-56"
      listClassName="max-h-none overflow-visible"
      options={SORT_OPTIONS}
      value={current}
      onChange={select}
      textColor="text-[#263238]"
    />
  );
}