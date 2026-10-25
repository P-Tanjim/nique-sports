'use client';

import { useState, useEffect } from 'react';

export const CART_STORAGE_KEY = 'nique-sports:cart';
export const CART_UPDATED_EVENT = 'nique-sports:cart-updated';

export const optionImage = (option) => {
  if (Array.isArray(option)) return option.map(optionImage).filter(Boolean).sort();
  return typeof option === 'string' ? option : option?.image ?? '';
};

export const cartKey = (item) => JSON.stringify([
  item.id ?? item._id,
  item.size ?? 'default',
  optionImage(item.customization?.font),
  optionImage(item.patch),
  item.customization?.name ?? '',
  item.customization?.number ?? '',
]);

export const cartVariantKey = (item) => JSON.stringify([
  item.id ?? item._id,
  optionImage(item.customization?.font),
  optionImage(item.patch),
  item.customization?.name ?? '',
  item.customization?.number ?? '',
]);

export function mergeCartItems(items, preferredItem) {
  const merged = [];
  const indexes = new Map();

  for (const item of items) {
    const key = cartKey(item);
    const existingIndex = indexes.get(key);
    if (existingIndex === undefined) {
      indexes.set(key, merged.length);
      merged.push(item);
      continue;
    }

    const existing = merged[existingIndex];
    const quantity = (Number(existing.quantity) || 1) + (Number(item.quantity) || 1);
    merged[existingIndex] = {
      ...(item === preferredItem ? item : existing),
      quantity,
    };
  }

  return merged;
}

export function readCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable (private mode / quota) — fail silently
  }
}

/**
 * Add a product to the cart from anywhere in the app (product card,
 * product page, quick-add button, ...). Merges quantities when the same
 * product + size is already in the cart. Persists to localStorage and
 * notifies every mounted listener to update immediately.
 */
export function addToCart(product, quantity = 1, size) {
  const cartProduct = {
    ...product,
    id: product.id ?? product._id,
    name: product.name ?? product.title,
    image: product.image ?? product.imagesLink?.[0],
    availableSizes: product.availableSizes ?? product.size ?? [],
    originalPrice: product.originalPrice ?? (product.discount ? product.beforePrice : undefined),
  };
  const cart = readCart();
  const nextItem = { ...cartProduct, size, quantity };
  const key = cartKey(nextItem);
  const variantKey = cartVariantKey(nextItem);
  const matchingItems = cart.filter((item) =>
    cartKey(item) === key || (size && !item.size && cartVariantKey(item) === variantKey)
  );
  const matchingQuantity = matchingItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const existingSizedItem = matchingItems.find((item) => cartKey(item) === key);
  const next = mergeCartItems([
    ...cart.filter((item) => !matchingItems.includes(item)),
    {
      ...(existingSizedItem ?? matchingItems[0] ?? {}),
      ...nextItem,
      quantity: matchingQuantity + quantity,
    },
  ]);

  writeCart(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
  return next;
}

/**
 * Live item count for anywhere that just needs a badge/number (e.g. the
 * navbar cart button) without mounting the whole drawer.
 */
export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    }
    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return count;
}
