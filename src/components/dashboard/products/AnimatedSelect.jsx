'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

const menuVariants = {
  closed: { opacity: 0, scale: 0.88, y: -8 },
  open: { opacity: 1, scale: 1, y: 0 },
};

export default function AnimatedSelect({
  id = 'select',
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  className = '',
  listClassName = 'max-h-64 overflow-auto',
  textColor = 'text-primary-dark',
}) {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const rootRef = useRef(null);
  const listRef = useRef(null); // 1. Added ref to track the menu's boundaries

  const current = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const indicatorIndex = hoveredIndex ?? (selectedIndex >= 0 ? selectedIndex : open ? 0 : -1);

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

  // Tracks the user's finger position
  // Tracks the user's finger position
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = element?.closest('button[data-index]');

    // Helper function to handle state change + haptic feedback
    const updateIndexWithHaptics = (newIndex) => {
      if (newIndex !== hoveredIndex) {
        setHoveredIndex(newIndex);
        // Trigger a tiny 10ms haptic tick (fails silently if unsupported)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    };

    if (button) {
      // Finger is over a valid option
      const index = parseInt(button.getAttribute('data-index'), 10);
      updateIndexWithHaptics(index);
    } else if (listRef.current) {
      // Finger went outside the menu. Clamp to top or bottom.
      const rect = listRef.current.getBoundingClientRect();
      if (touch.clientY < rect.top) {
        updateIndexWithHaptics(0); // Snap to first item
      } else if (touch.clientY > rect.bottom) {
        updateIndexWithHaptics(options.length - 1); // Snap to last item
      }
    }
  };
  // 3. Confirm selection when the user lifts their finger after scrubbing
  const handleTouchEnd = () => {
    if (hoveredIndex !== null && open) {
      onChange(options[hoveredIndex].value);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            setHoveredIndex(null);
          } else {
            setHoveredIndex(selectedIndex >= 0 ? selectedIndex : 0);
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm text-text outline-none transition-colors focus:border-primary"
      >
        <span className={current ? 'text-text' : 'text-text-muted'}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''
            }`}
        />
      </button>

      <ul
        ref={listRef}
        role="listbox"
        onMouseLeave={() => setHoveredIndex(null)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`touch-none absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-auto rounded-[24px] border border-white/10 bg-primary-dark/20 p-2 shadow-2xl backdrop-blur-sm backdrop-saturate-150 transition-all duration-200 ease-out origin-top ${open
          ? 'visible pointer-events-auto opacity-100 scale-100 translate-y-0'
          : 'invisible pointer-events-none opacity-0 scale-40 -translate-y-2'
          }`}
      >
        {options.map((option, index) => (
          <li key={option.value} role="option" aria-selected={option.value === value}>
            <button
              type="button"
              data-index={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onTouchStart={() => setHoveredIndex(index)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="group/item relative flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-primary-dark"
            >
              {indicatorIndex === index && (
                <motion.div
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-2xl border border-white/20 bg-white/15 shadow-inner"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <span className={`relative z-10 ${textColor} transition-transform duration-200 group-hover/item:translate-x-1`}>
                {option.label}
              </span>

              {option.value === value && (
                <Check size={16} className={`relative z-10 ${textColor} shrink-0`} />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}