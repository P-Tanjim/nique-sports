// lib/format.js
export function formatPrice(value) {
  return Number(value).toLocaleString('en-US');
}