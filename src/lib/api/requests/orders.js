// →  src/lib/api/requests/orders.js
'use server';

import { appendRowToSheet } from '@/lib/googleSheets';
import { getItemLineTotal } from '@/lib/checkout/pricing';

function generateOrderId() {
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NS-${stamp}-${rand}`;
}

function describeItem(item) {
  const bits = [`${item.name ?? item.title} x${item.quantity}`];
  if (item.size) bits.push(`Size ${item.size}`);
  if (item.customization?.name) bits.push(`Name "${item.customization.name}"`);
  if (item.customization?.number) bits.push(`No. ${item.customization.number}`);
  if (item.patch) bits.push('+Patch');
  if (item.customization?.font) bits.push('+Font');
  return `${bits.join(', ')} — ${getItemLineTotal(item)}৳`;
}

// Appends one row per order to the connected Google Sheet — see
// lib/googleSheets.js for the env vars this needs. When you're ready to
// move to a real database, swap the body of this function for an insert;
// nothing that calls submitOrder() has to change.
export async function submitOrder(payload) {
  const { customer, items, deliveryArea, deliveryFee, subtotal, total } = payload || {};

  if (!customer?.name?.trim() || !customer?.address?.trim() || !customer?.phone?.trim()) {
    return { success: false, error: 'Please fill in your name, address and phone number.' };
  }
  if (!items?.length) {
    return { success: false, error: 'Your cart is empty.' };
  }

  const orderId = generateOrderId();
  const row = [
    orderId,
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }),
    customer.name,
    customer.phone,
    customer.phone2 || '',
    customer.address,
    customer.note || '',
    deliveryArea || '',
    deliveryFee,
    subtotal,
    total,
    items.map(describeItem).join('\n'),
    'Cash on Delivery',
    'Pending',
  ];

  try {
    await appendRowToSheet(row);
  } catch (error) {
    console.error('Order submission failed:', error);
    return {
      success: false,
      error: 'Could not save your order right now. Please try again or contact us.',
    };
  }

  return { success: true, orderId };
}