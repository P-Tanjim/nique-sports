// →  src/components/checkout/CheckoutBottomSheet.jsx
'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const SETTLE_EASE = 'cubic-bezier(0.207,0.473,0.504,0.935)'; // this app's signature drawer ease

// Two resting positions, no framework drag engine:
//  - collapsed: handle row peeks above the mobile bottom nav while sheet rests at bottom: 0 (z-40 under bottom nav z-50).
//  - expanded: handle row + full summary, page behind it dimmed + blurred.
export default function CheckoutBottomSheet({ total, itemCount, children }) {
  const contentRef = useRef(null);
  const dragState = useRef(null);
  const justDraggedRef = useRef(false);

  const [expanded, setExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(null); // px, only set while actively dragging
  const [collapsedOffset, setCollapsedOffset] = useState(0);

  // Measured before paint (useLayoutEffect) so the sheet never flashes open
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    function measure() {
      setCollapsedOffset(content.offsetHeight);
    }
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function handlePointerDown(e) {
    dragState.current = {
      startY: e.clientY,
      startOffset: expanded ? 0 : collapsedOffset,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragState.current) return;
    const delta = e.clientY - dragState.current.startY;
    if (Math.abs(delta) > 4) dragState.current.moved = true;
    setDragOffset(Math.min(collapsedOffset, Math.max(0, dragState.current.startOffset + delta)));
  }

  function handlePointerUp() {
    if (!dragState.current) return;
    if (dragState.current.moved) {
      justDraggedRef.current = true;
      const finalOffset = dragOffset ?? (expanded ? 0 : collapsedOffset);
      setExpanded(finalOffset < collapsedOffset / 2);
    }
    dragState.current = null;
    setDragOffset(null);
  }

  function handleHandleClick() {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    setExpanded((value) => !value);
  }

  const offset = dragOffset ?? (expanded ? 0 : collapsedOffset);
  const isDragging = dragOffset !== null;

  return (
    <>
      {/* Blurred dim behind the sheet, under mobile bottom nav (z-35 vs nav z-50) */}
      <div
        onClick={() => setExpanded(false)}
        className={`fixed inset-0 z-35 bg-ink/35 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          expanded ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-label="Order summary"
        style={{
          transform: `translateY(${offset}px)`,
          transition: isDragging ? 'none' : `transform 0.38s ${SETTLE_EASE}`,
          bottom: 0,
        }}
        className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg overflow-hidden rounded-t-3xl border-t border-x border-border/70 ${
          expanded ? 'bg-white/98 shadow-[0_-16px_48px_rgba(32,36,38,0.22)]' : 'bg-white/75 shadow-[0_-8px_30px_rgba(32,36,38,0.12)]'
        } backdrop-blur-xl transition-all will-change-transform lg:hidden`}
      >
        {/* Handle + peek row — always visible; positioned to peek above the floating bottom nav */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleHandleClick}
          className="flex touch-none cursor-grab select-none flex-col items-center gap-2 px-5 pt-3 pb-22 active:cursor-grabbing"
        >
          <span className="h-1 w-10 rounded-full bg-border" />
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-medium text-text-muted">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text">
              {formatPrice(total)}৳
              <ChevronUp
                size={15}
                className={`text-text-muted transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              />
            </span>
          </div>
        </div>

        {/* Summary + Place Order — scrollable with clearance for bottom nav */}
        <div
          ref={contentRef}
          className="max-h-[calc(78vh-6rem)] overflow-y-auto overscroll-contain px-5 pb-28 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>
    </>
  );
}