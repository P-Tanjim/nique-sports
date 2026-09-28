// →  src/lib/checkout/pricing.js
//
// Shared pricing/delivery math for the checkout page. Kept framework-agnostic
// (no 'use client' / 'use server') so both client components and the
// server action can import it.

export const DELIVERY_OPTIONS = [
  { value: 'inside-dhaka', label: 'Inside Dhaka', fee: 70 },
  { value: 'outside-dhaka', label: 'Outside Dhaka', fee: 120 },
];

export function getDeliveryFee(areaValue) {
  return DELIVERY_OPTIONS.find((option) => option.value === areaValue)?.fee ?? 0;
}

export function getDeliveryLabel(areaValue) {
  return DELIVERY_OPTIONS.find((option) => option.value === areaValue)?.label ?? '';
}

// Cart items come from a few different call sites (quick-add on the shop
// grid vs. the full customization flow on a product page), so these reads
// stay defensive rather than assuming one exact shape.
export function getItemUnitPrice(item) {
  return Number(item?.price) || 0;
}

export function getItemLineTotal(item) {
  return getItemUnitPrice(item) * (Number(item?.quantity) || 1);
}

export function getCartSubtotal(items) {
  return (items ?? []).reduce((sum, item) => sum + getItemLineTotal(item), 0);
}