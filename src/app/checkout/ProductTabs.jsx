// →  src/components/checkout/ProductTabs.jsx
'use client';

import { motion } from 'framer-motion';

// Hidden for a single-item cart — nothing to switch between. The sliding
// pill uses the same layoutId trick as the desktop Shop menu (ShopMenu.jsx).
export default function ProductTabs({ items, activeIndex, onSelect }) {
  if (items.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Items in your order"
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(index)}
            className="relative shrink-0 cursor-pointer rounded-2xl border border-border bg-white px-4 py-2 text-sm font-medium transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId="checkout-tab-pill"
                className="absolute -inset-px rounded-2xl bg-primary shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? 'text-white' : 'text-text-muted'}`}>
              Jersey {index + 1}
              {Number(item.quantity) > 1 && (
                <span className={`ml-1.5 text-[11px] ${isActive ? 'text-white/80' : 'text-text-muted/70'}`}>
                  ×{item.quantity}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}   