'use client';

/**
 * SideCart — persistent shopping-cart drawer.
 * ---------------------------------------------------------------
 * Cart items live in localStorage under CART_STORAGE_KEY as:
 *   [{ id, slug, name, price, originalPrice?, image, size?, quantity }]
 *
 * Add an item to the cart from anywhere in the app, e.g. from a
 * product's "Add to cart" button:
 *
 *   import { CART_STORAGE_KEY } from '@/components/cart/SideCart';
 *
 *   function addToCart(product, quantity = 1, size) {
 *     const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
 *     const key = `${product.id}__${size ?? 'default'}`;
 *     const existing = cart.find((p) => `${p.id}__${p.size ?? 'default'}` === key);
 *     const next = existing
 *       ? cart.map((p) => (p === existing ? { ...p, quantity: p.quantity + quantity } : p))
 *       : [...cart, { ...product, size, quantity }];
 *     localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
 *     window.dispatchEvent(new Event('storage')); // nudges any mounted SideCart to re-read
 *   }
 *
 * This component is fully controlled — mount it once near the root
 * (e.g. in Navbar.jsx, right next to the existing cart button) and
 * toggle it from there:
 *
 *   const [cartOpen, setCartOpen] = useState(false);
 *   <SideCart open={cartOpen} onClose={() => setCartOpen(false)} />
 *   <button onClick={() => setCartOpen(true)}><ShoppingCart size={20} /></button>
 * ---------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBasket, X } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import SideCartProducts from './SideCartProducts';

export const CART_STORAGE_KEY = 'nique-sports:cart';
const FREE_SHIPPING_THRESHOLD = 2000;

const cartKey = (item) => `${item.id}__${item.size ?? 'default'}`;

function readCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode / quota) — fail silently
  }
}

export default function SideCart({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // Read the cart once on mount — localStorage doesn't exist on the server,
  // so this can only happen client-side after hydration.
  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  // Stay in sync if the cart is changed from another tab (or by an
  // "add to cart" button elsewhere that dispatches a storage event).
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === CART_STORAGE_KEY || e.key === null) setItems(readCart());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Persist every change — skipped until the initial read has happened,
  // so we never overwrite real saved data with an empty array.
  useEffect(() => {
    if (!hydrated) return;
    writeCart(items);
  }, [items, hydrated]);

  // Lock background scroll + close on Escape, matching the other
  // drawers/modals already in this app.
  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleQuantityChange = useCallback((item, nextQuantity) => {
    setItems((prev) =>
      nextQuantity < 1
        ? prev.filter((p) => cartKey(p) !== cartKey(item))
        : prev.map((p) => (cartKey(p) === cartKey(item) ? { ...p, quantity: nextQuantity } : p))
    );
  }, []);

  const handleRemove = useCallback((item) => {
    setItems((prev) => prev.filter((p) => cartKey(p) !== cartKey(item)));
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const savings = useMemo(
    () => items.reduce((sum, i) => sum + Math.max(0, (i.originalPrice ?? i.price) - i.price) * i.quantity, 0),
    [items]
  );
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-9998 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* PANEL */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed inset-y-0 right-0 z-9999 flex h-dvh w-[85%] flex-col bg-white shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.207,0.473,0.504,0.935)] sm:w-105 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <ShoppingBasket size={17} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-text">Your Busket</h2>
              {itemCount > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-text-muted">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                  <span className="text-text-muted/40">•</span>
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-xs font-medium text-danger transition-colors hover:underline"
                  >
                    Clear cart
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="group flex h-9 w-9 cursor-pointer shrink-0 items-center justify-center rounded-full text-text-muted transition-all duration-200 hover:bg-surface hover:text-text active:scale-90"
          >
            <X size={18} className="transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        {/* FREE SHIPPING PROGRESS */}
        {hydrated && items.length > 0 && (
          <div className="border-b border-border bg-surface-blue/60 px-5 py-3 sm:px-6">
            {remainingForFreeShipping > 0 ? (
              <p className="text-xs text-text-muted">
                Add <span className="font-semibold text-primary">{formatPrice(remainingForFreeShipping)}৳</span>{' '}
                more for free shipping
              </p>
            ) : (
              <p className="text-xs font-medium text-success">You’ve unlocked free shipping 🎉</p>
            )}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {!hydrated ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="h-20 w-20 shrink-0 rounded-2xl bg-surface" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-3/4 rounded bg-surface" />
                    <div className="h-3 w-1/2 rounded bg-surface" />
                    <div className="h-3 w-1/4 rounded bg-surface" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted">
                <ShoppingBasket size={26} strokeWidth={1.5} />
              </span>
              <p className="mt-4 text-base font-medium text-text">Your bag is empty</p>
              <p className="mt-1 text-sm text-text-muted">Looks like you haven’t added anything yet.</p>
              <Link
                href="/shop"
                onClick={onClose}
                className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item, index) => (
                <SideCartProducts
                  key={cartKey(item)}
                  item={item}
                  index={index}
                  onQuantityChange={(next) => handleQuantityChange(item, next)}
                  onRemove={() => handleRemove(item)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* FOOTER */}
        {hydrated && items.length > 0 && (
          <div className="border-t border-border bg-white px-5 py-5 sm:px-6">
            {savings > 0 && (
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-text-muted">You’re saving</span>
                <span className="font-semibold text-success">{formatPrice(savings)}৳</span>
              </div>
            )}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-text-muted">Subtotal</span>
              <span className="text-xl font-semibold text-text">{formatPrice(subtotal)}৳</span>
            </div>
            <p className="mb-4 text-xs text-text-muted">Shipping and taxes calculated at checkout.</p>

            <Link
              href="/checkout"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_10px_25px_-8px_rgba(48,136,152,0.5)] transition-all duration-200 hover:bg-primary-dark active:scale-[0.98]"
            >
              Checkout
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/shop"
              onClick={onClose}
              className="mt-3 flex w-full items-center justify-center text-sm font-medium text-text-muted transition-colors hover:text-primary"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}