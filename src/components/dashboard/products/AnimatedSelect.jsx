'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

// Avoids the SSR warning for useLayoutEffect in Next.js
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// `up` is passed in via `custom` so the menu slides from the correct side
const menuVariants = {
  closed: (up) => ({ opacity: 0, scale: 0.96, y: up ? 5 : -5 }),
  open: { opacity: 1, scale: 1, y: 0 },
};

export default function AnimatedSelect({
  id = 'select',
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  name,
  placeholder = 'Select…',
  className = '',
  triggerClassName,
  listClassName = 'max-h-64 overflow-auto',
  textColor = 'text-primary-dark',
  triggerIcon: TriggerIcon = ChevronDown,
  triggerLabel,
  iconOnly = false,
  listAlignment = 'left',
}) {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [placement, setPlacement] = useState({ up: false, maxHeight: undefined });

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const selectedValue = value !== undefined ? value : uncontrolledValue;
  const current = options.find((o) => o.value === selectedValue);
  const selectedIndex = options.findIndex((o) => o.value === selectedValue);
  const indicatorIndex = hoveredIndex ?? (selectedIndex >= 0 ? selectedIndex : open ? 0 : -1);
  const defaultTriggerClassName = iconOnly
    ? 'flex size-8 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm text-text shadow-sm outline-none transition-all hover:scale-[1.1] focus:border-primary'
    : 'mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-2xl bg-surface px-4 py-3 text-left text-sm text-text outline-none transition-colors focus:border-primary';

  const selectOption = (nextValue) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  };

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

  // Runs after the menu mounts but BEFORE the browser paints,
  // so the user never sees it open in the wrong place first.
  useIsoLayoutEffect(() => {
    if (!open || !listRef.current || !triggerRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    // offsetHeight ignores the scale animation, so it's the real height
    const listHeight = listRef.current.offsetHeight;
    const gap = 16; // 8px menu margin + 8px breathing room from the screen edge

    const spaceBelow = window.innerHeight - trigger.bottom - gap;
    const spaceAbove = trigger.top - gap;

    const openUp = listHeight > spaceBelow && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;

    setPlacement({
      up: openUp,
      // If it doesn't fit on either side, shrink it and let it scroll
      maxHeight: listHeight > available ? Math.max(available, 96) : undefined,
    });
  }, [open]);

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const button = element?.closest('button[data-index]');

    const updateIndexWithHaptics = (newIndex) => {
      if (newIndex !== hoveredIndex) {
        setHoveredIndex(newIndex);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    };

    if (button) {
      const index = parseInt(button.getAttribute('data-index'), 10);
      updateIndexWithHaptics(index);
    } else if (listRef.current) {
      const rect = listRef.current.getBoundingClientRect();
      if (touch.clientY < rect.top) {
        updateIndexWithHaptics(0);
      } else if (touch.clientY > rect.bottom) {
        updateIndexWithHaptics(options.length - 1);
      }
    }
  };

  const handleTouchEnd = () => {
    if (hoveredIndex !== null && open) {
      selectOption(options[hoveredIndex].value);
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={selectedValue ?? ''} />}
      {label && (
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          {label}
        </label>
      )}

      {/* This wrapper makes "bottom-full" mean "just above the button", not above the label */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
              setHoveredIndex(null);
            } else {
              // Reset so the menu is measured at its natural size each time it opens
              setPlacement({ up: false, maxHeight: undefined });
              setHoveredIndex(selectedIndex >= 0 ? selectedIndex : 0);
              setOpen(true);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={triggerLabel || undefined}
          className={triggerClassName ?? defaultTriggerClassName}
        >
          {iconOnly ? (
            <span className="sr-only">{triggerLabel || placeholder}</span>
          ) : (
            <span className={current ? 'text-text' : 'text-text-muted'}>
              {current ? current.label : placeholder}
            </span>
          )}
          <TriggerIcon
            size={iconOnly ? 18 : 15}
            className={`shrink-0 text-primary transition-transform duration-300 ${TriggerIcon === ChevronDown && open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* `custom` lets the exit animation know which direction to slide */}
        <AnimatePresence custom={placement.up}>
          {open && (
            <motion.ul
              ref={listRef}
              role="listbox"
              custom={placement.up}
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={placement.maxHeight ? { maxHeight: placement.maxHeight } : undefined}
              className={`touch-none absolute ${listAlignment === 'right' ? 'right-0 w-36' : 'left-0 right-0'} z-50 ${
                placement.up ? 'bottom-full mb-2 origin-bottom' : 'mt-2 origin-top'
              } rounded-[24px] border border-white/10 bg-primary-dark/20 p-2 shadow-2xl backdrop-blur-sm backdrop-saturate-150 ${listClassName}`}
            >
              {options.map((option, index) => (
                <li key={option.value} role="option" aria-selected={option.value === selectedValue}>
                  <button
                    type="button"
                    data-index={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onTouchStart={() => setHoveredIndex(index)}
                    onClick={() => {
                      selectOption(option.value);
                      setOpen(false);
                    }}
                    className="group/item relative flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-primary-dark"
                  >
                    {indicatorIndex === index && (
                      <motion.div
                        layoutId={`${id}-pill`}
                        className="absolute inset-0 rounded-2xl border border-white/20 bg-primary-soft/15 shadow-inner"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    <span className={`relative z-10 ${option.textColor || textColor} transition-transform duration-200 group-hover/item:translate-x-1`}>
                      {option.label}
                    </span>

                    {option.value === selectedValue && (
                      <Check size={16} className={`relative z-10 ${option.textColor || textColor} shrink-0`} />
                    )}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}