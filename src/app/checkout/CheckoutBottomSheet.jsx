// →  src/components/checkout/CheckoutBottomSheet.jsx
'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { formatPrice } from '@/lib/format';

// Distance to clear MobileBottomNav's fixed pill (bottom-5 + ~64px tall,
// see Navbar.jsx). This is the "bottom padding" that keeps the sheet's
// content above the nav instead of getting cut by it — bump it if that
// nav ever changes size.
const NAV_CLEARANCE = 84;
const SETTLE_EASE = 'cubic-bezier(0.207,0.473,0.504,0.935)'; // this app's signature drawer ease

// Two resting positions, no framework drag engine:
//  - collapsed: only the handle row (item count + total) is showing, the
//    summary sits below it, out of view. This is where the page starts.
//  - expanded: handle row + full summary, page behind it dimmed + blurred.
// The sheet is moved with ONE transform (translateY), so dragging only ever
// touches the compositor — no layout, no repaint of the page behind it.
export default function CheckoutBottomSheet({ total, itemCount, children }) {
  const contentRef = useRef(null);
  const dragState = useRef(null);
  const justDraggedRef = useRef(false);

  const [expanded, setExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(null); // px, only set while actively dragging
  const [collapsedOffset, setCollapsedOffset] = useState(0);

  // Measured before paint (useLayoutEffect) so the sheet never flashes open
  // for a frame before settling collapsed — same trick SideCartProducts.jsx
  // uses. offsetHeight (not scrollHeight) on purpose: once a long cart hits
  // the summary's max-height and scrolls inside itself, offsetHeight is the
  // capped, actually-rendered height, which is what the collapse distance
  // has to match.
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
      // A real drag: snap to whichever resting spot is closer, and flag it
      // so the click event that follows the pointer-up doesn't toggle the
      // sheet right back.
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
      {/* Blurred dim behind the sheet, only once it's pulled open. A plain
          opacity toggle (no per-frame interpolation) so dragging never has
          to repaint anything except the sheet itself. */}
      <div
        onClick={() => setExpanded(false)}
        className={`fixed inset-0 z-60 bg-ink/35 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          expanded ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-label="Order summary"
        style={{
          transform: `translateY(${offset}px)`,
          transition: isDragging ? 'none' : `transform 0.38s ${SETTLE_EASE}`,
          bottom: NAV_CLEARANCE,
        }}
        className="fixed inset-x-0 z-70 mx-3 overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-[0_-12px_40px_rgba(32,36,38,0.18)] backdrop-blur-xl will-change-transform lg:hidden"
      >
        {/* Handle + peek row — always visible; drag it or tap it */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleHandleClick}
          className="flex touch-none cursor-grab select-none flex-col items-center gap-2 px-5 pb-3 pt-2.5 active:cursor-grabbing"
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

        {/* Summary + Place Order — this is the part that gets measured above */}
        <div
          ref={contentRef}
          className="max-h-[calc(65vh-4.5rem)] overflow-y-auto overscroll-contain px-5 pb-6"
        >
          {children}
        </div>
      </div>
    </>
  );
}