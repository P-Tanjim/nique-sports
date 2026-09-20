'use client';

import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const UNDO_WINDOW_MS = 4000;
const HEIGHT_TRANSITION_MS = 280;

// Scoped keyframes for this component, shipped inline so this file works
// the moment you drop it in — nothing else to paste into globals.css.
// If your cart usually shows more than a couple of items, you can lift
// this <style> block up into the parent list once (or into your theme
// CSS) so it isn't repeated per row — purely a micro-optimization, not
// required for it to work.
const CART_ITEM_KEYFRAMES = `
  @keyframes cart-card-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cart-panel-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes cart-count-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cart-count-down {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cart-undo-bar {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
`;

// Keeps a wrapper's height in sync with its content's real height and
// lets CSS transition between the two, instead of the content just
// snapping to its new intrinsic size. The trick: an inner div renders
// its content normally (nothing sets its own height), a ResizeObserver
// watches that inner div, and every time its measured height changes we
// write that number as an explicit px height onto the outer wrapper —
// which does have `transition: height`. Because the height is only
// ever set from a measurement (never guessed), it works no matter what
// swaps in — a whole different layout, an image loading in, text
// wrapping differently, anything.
//
// The one thing to get right is the very first paint: we set the
// initial height inside useLayoutEffect, which runs after the DOM is
// updated but before the browser paints, so the first thing anyone
// sees is already the correct height — no grow-in animation on mount.
function useHeightTransition() {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    outer.style.height = `${inner.offsetHeight}px`;

    const observer = new ResizeObserver(([entry]) => {
      outer.style.height = `${entry.contentRect.height}px`;
    });
    observer.observe(inner);

    return () => observer.disconnect();
  }, []);

  return { outerRef, innerRef };
}

export default function SideCartProducts({
  item,
  index,
  onQuantityChange,
  onRemove,
}) {
  // Removing is reversible — tap trash, watch the border count down,
  // tap Undo before it runs out, or let it finish and it's gone.
  const [isRemoving, setIsRemoving] = useState(false);
  const undoTimer = useRef(null);
  const { outerRef, innerRef } = useHeightTransition();

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  // Direction-aware count animation — no animation library involved.
  // Giving the digit a new `key` on every change makes React mount a
  // fresh DOM node, and a fresh node always plays its CSS `animation`
  // on entry. No exit-timing, no AnimatePresence, nothing to get stuck.
  const prevQuantityRef = useRef(item.quantity);
  const quantityDirection =
    item.quantity > prevQuantityRef.current
      ? 'up'
      : item.quantity < prevQuantityRef.current
      ? 'down'
      : null;

  useEffect(() => {
    prevQuantityRef.current = item.quantity;
  }, [item.quantity]);

  const countAnimClass =
    quantityDirection === 'up'
      ? 'animate-[cart-count-up_0.18s_ease-out]'
      : quantityDirection === 'down'
      ? 'animate-[cart-count-down_0.18s_ease-out]'
      : '';

  const hasDiscount =
    item.originalPrice && item.originalPrice > item.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((item.originalPrice - item.price) / item.originalPrice) * 100
      )
    : 0;

  const increaseQuantity = () => onQuantityChange(item.quantity + 1);

  const decreaseQuantity = () => {
    if (item.quantity <= 1) return; // use the trash icon to remove, not 0
    onQuantityChange(item.quantity - 1);
  };

  const handleRemoveTap = () => {
    setIsRemoving(true);
    undoTimer.current = setTimeout(onRemove, UNDO_WINDOW_MS);
  };

  const handleUndo = () => {
    clearTimeout(undoTimer.current);
    setIsRemoving(false);
  };

  return (
    <article
      style={{
        animation: 'cart-card-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        animationDelay: `${index * 40}ms`,
      }}
      className="
        relative
        overflow-hidden
        rounded-xl
        border border-border/80
        bg-white
        transition-colors
        duration-200
        hover:border-primary/30
        focus-within:border-primary/40
      "
    >
      <style>{CART_ITEM_KEYFRAMES}</style>

      {/* HEIGHT-ANIMATED WRAPPER — outer div's height is driven by the
          ResizeObserver in useHeightTransition and tweens via this CSS
          transition; inner div just renders whichever branch normally. */}
      <div
        ref={outerRef}
        style={{
          overflow: 'hidden',
          transition: `height ${HEIGHT_TRANSITION_MS}ms cubic-bezier(0.22,1,0.36,1)`,
        }}
      >
        <div ref={innerRef}>
          {isRemoving ? (
            /* =====================================================
                REMOVED — reversible until the border runs out
            ===================================================== */
            <div
              key="removed"
              style={{ animation: 'cart-panel-in 0.15s ease-out both' }}
              className="relative flex items-center justify-between gap-3 px-4 py-6"
            >
              <p className="text-[13px] text-text-muted">
                Removed <span className="font-medium text-text">{item.name}</span>
              </p>
              <button
                type="button"
                onClick={handleUndo}
                className="
                  cursor-pointer
                  inline-flex shrink-0 items-center gap-1.5
                  rounded-lg px-2.5 py-1.5
                  text-[12px] font-semibold text-primary-dark
                  transition-colors duration-150
                  hover:bg-primary-soft
                  active:scale-95
                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-primary/30
                "
              >
                <RotateCcw size={13} strokeWidth={2.2} />
                Undo
              </button>

              {/* Countdown border — actually depletes now. Duration is
                  driven by UNDO_WINDOW_MS above, so it can't drift out
                  of sync with the real timer. */}
              <span
                aria-hidden="true"
                style={{
                  animation: `cart-undo-bar ${UNDO_WINDOW_MS}ms linear forwards`,
                }}
                className="absolute inset-x-0 bottom-0 h-0.75 origin-left bg-primary/70"
              />
            </div>
          ) : (
            /* =====================================================
                DEFAULT
            ===================================================== */
            <div
              key="content"
              style={{ animation: 'cart-panel-in 0.12s ease-out both' }}
              className="group flex gap-3 p-2.5 sm:p-3"
            >
              {/* PRODUCT IMAGE */}
              <div
                className="
                  relative h-20 w-20 shrink-0
                  overflow-hidden rounded-lg bg-surface
                  sm:h-24 sm:w-24
                "
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="
                      object-cover
                      transition-transform duration-500 ease-out
                      group-hover:scale-[1.04]
                    "
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-text-muted">
                    No image
                  </div>
                )}

                {hasDiscount && (
                  <span
                    className="
                      absolute left-1.5 top-1.5
                      rounded-md bg-primary px-1.5 py-0.5
                      text-[10px] font-bold text-white
                      shadow-sm
                    "
                  >
                    -{discountPercentage}%
                  </span>
                )}
              </div>

              {/* PRODUCT INFO */}
              <div className="min-w-0 flex-1 py-0.5 pr-7">
                <h3
                  className="
                    line-clamp-2 text-[13px] font-semibold leading-[1.35]
                    tracking-[-0.005em] text-text
                  "
                >
                  {item.name}
                </h3>

                {item.size && (
                  <p className="mt-1 text-[11px] font-medium text-text-muted">
                    Size: <span className="text-text">{item.size}</span>
                  </p>
                )}

                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary-dark">
                    {formatPrice(item.price)}৳
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] text-text-muted line-through">
                      {formatPrice(item.originalPrice)}৳
                    </span>
                  )}
                </div>

                {/* QUANTITY + LINE TOTAL — both always visible, mobile included */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div
                    role="group"
                    aria-label={`Quantity for ${item.name}`}
                    className="
                      inline-flex h-9 items-center overflow-hidden
                      rounded-lg border border-border bg-surface
                    "
                  >
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="
                        cursor-pointer
                        flex h-full w-9 items-center justify-center
                        text-text-muted
                        transition-[color,background-color,transform] duration-150
                        enabled:hover:bg-primary-soft enabled:hover:text-primary-dark
                        enabled:active:scale-90
                        disabled:cursor-not-allowed disabled:opacity-30
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-inset focus-visible:ring-primary/30
                      "
                    >
                      <Minus size={13} strokeWidth={2} />
                    </button>

                    {/* Plain CSS count animation, see countAnimClass above */}
                    <span
                      aria-live="polite"
                      className="
                        relative flex h-full min-w-8 items-center justify-center
                        overflow-hidden border-x border-border bg-white px-1
                      "
                    >
                      <span
                        key={item.quantity}
                        className={`text-xs font-semibold tabular-nums text-text ${countAnimClass}`}
                      >
                        {item.quantity}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      aria-label={`Increase quantity of ${item.name}`}
                      className="
                        cursor-pointer
                        flex h-full w-9 items-center justify-center
                        text-text-muted
                        transition-[color,background-color,transform] duration-150
                        hover:bg-primary-soft hover:text-primary-dark
                        active:scale-90
                        focus-visible:outline-none focus-visible:ring-2
                        focus-visible:ring-inset focus-visible:ring-primary/30
                      "
                    >
                      <Plus size={13} strokeWidth={2} />
                    </button>
                  </div>

                  <span className="relative h-4 overflow-hidden">
                    <span
                      key={item.price * item.quantity}
                      className={`block text-[12px] font-semibold text-text ${countAnimClass}`}
                    >
                      {formatPrice(item.price * item.quantity)}৳
                    </span>
                  </span>
                </div>
              </div>

              {/* REMOVE */}
              <button
                type="button"
                onClick={handleRemoveTap}
                aria-label={`Remove ${item.name} from cart`}
                className="
                  cursor-pointer
                  absolute right-2.5 top-2.5
                  flex h-8 w-8 items-center justify-center
                  rounded-lg text-text-muted/70
                  transition-[color,background-color,transform] duration-200
                  hover:bg-danger/8 hover:text-danger
                  active:scale-90
                  focus-visible:opacity-100 focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-danger/30
                  sm:opacity-0 sm:group-hover:opacity-100
                "
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}