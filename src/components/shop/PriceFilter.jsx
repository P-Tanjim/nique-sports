'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/format';

// Two overlapping native <input type="range"> elements make a dual-thumb
// slider. Each track is transparent and ignores pointer events; only the
// thumb itself is interactive, so both handles stay independently draggable
// even though they occupy the same box. Pure Tailwind arbitrary variants —
// no extra CSS file needed.
const THUMB_CLASSES =
  'absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none ' +
  '[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 ' +
  '[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
  '[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white ' +
  '[&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(32,36,38,0.25)] ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-primary ' +
  '[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(32,36,38,0.25)]';

export default function PriceFilter({ min, max, step = 10 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef(null);

  const urlMin = Number(searchParams.get('minPrice')) || min;
  const urlMax = Number(searchParams.get('maxPrice')) || max;

  const [range, setRange] = useState([urlMin, urlMax]);

  // Stay in sync if the URL changes from elsewhere (e.g. a "clear filters" link).
  useEffect(() => {
    setRange([urlMin, urlMax]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMin, urlMax]);

  const commit = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('minPrice', String(next[0]));
      params.set('maxPrice', String(next[1]));
      params.delete('page'); // a new filter invalidates the current page number
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Debounce the URL write so dragging the thumb doesn't fire a navigation
  // (and therefore a re-fetch) on every pixel of movement.
  const scheduleCommit = useCallback(
    (next) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => commit(next), 400);
    },
    [commit]
  );

  useEffect(() => () => timeoutRef.current && clearTimeout(timeoutRef.current), []);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), range[1] - step);
    const next = [value, range[1]];
    setRange(next);
    scheduleCommit(next);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), range[0] + step);
    const next = [range[0], value];
    setRange(next);
    scheduleCommit(next);
  };

  const percent = (value) => ((value - min) / (max - min || 1)) * 100;

  return (
    <div>
      <div className="relative h-1.5 rounded-full bg-border">
        <div
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: `${percent(range[0])}%`, right: `${100 - percent(range[1])}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={range[0]}
          onChange={handleMinChange}
          aria-label="Minimum price"
          className={THUMB_CLASSES}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={range[1]}
          onChange={handleMaxChange}
          aria-label="Maximum price"
          className={THUMB_CLASSES}
        />
      </div>

      <div className="mt-4 text-sm text-text-muted">
        Price: <span className="font-medium text-text">{formatPrice(range[0])}৳</span> —{' '}
        <span className="font-medium text-text">{formatPrice(range[1])}৳</span>
      </div>
    </div>
  );
}