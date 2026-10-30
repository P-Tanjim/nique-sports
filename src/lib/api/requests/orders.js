'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { DELIVERY_OPTIONS, getDeliveryFee } from '@/lib/checkout/pricing';
import { clean, itemsSummary, money, normalizePhone, todayDhaka } from '@/lib/orders/helpers';
import { rateLimit } from '@/lib/rateLimit';
import { appendOrder, findRecentDuplicate, makeOrderNo } from '@/lib/sheets/orders';
import { courierEnabled, getSettings } from '@/lib/sheets/settings';
import { dispatchToSteadfast } from '@/lib/services/courier';
import { releaseStock, reserveStock } from '@/lib/services/stock';
 
// Public website checkout. Same name + same payload as before, so CheckoutClient is untouched.
// Prices are ALWAYS recomputed here from the product catalogue (never trusted from the browser).

const API = process.env.API;
const bad = (error) => ({ success: false, error });

function text(v, label, max, min = 1) {
  if (typeof v !== 'string') throw new Error(`${label} must be text.`);
  const s = v.trim();
  if (s.length < min || s.length > max) throw new Error(`${label} must be ${min}-${max} characters.`);
  return s;
}

async function loadProduct(id) {
  const res = await fetch(`${API}/products/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()).data ?? null;
}

function priced(options, image, label) {
  const found = (Array.isArray(options) ? options : []).find((e) => (typeof e === 'string' ? e : e?.image) === image);
  if (!found) throw new Error(`The selected ${label} is invalid.`);
  const price = typeof found === 'string' ? 0 : Number(found.price);
  if (!Number.isFinite(price) || price < 0) throw new Error(`The selected ${label} has an invalid price.`);
  return { image, price };
}

export async function submitOrder(payload) {
  let reserved = null;
  try {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    if (!rateLimit(`order:${ip}`, 8, 10 * 60_000)) return bad('Too many order attempts. Please try again shortly.');

    const c = payload?.customer ?? {};
    const name = text(c.name, 'Name', 100);
    const address = text(c.address, 'Address', 500, 5);
    const phone = normalizePhone(c.phone);
    if (!phone) return bad('Enter a valid 11-digit phone number.');
    const phone2 = clean(c.phone2) ? normalizePhone(c.phone2) : '';
    if (clean(c.phone2) && !phone2) return bad('Enter a valid alternate phone number.');
    const note = clean(c.note).slice(0, 1000);

    const area = payload?.deliveryArea;
    if (!DELIVERY_OPTIONS.some((o) => o.value === area)) return bad('Choose a valid delivery area.');

    const lines = Array.isArray(payload?.items) ? payload.items : [];
    if (lines.length < 1 || lines.length > 30) return bad('An order must contain between 1 and 30 items.');

    const requested = lines.map((it, i) => {
      const productId = String(it?.id ?? it?._id ?? '');
      if (!/^[a-f\d]{24}$/i.test(productId)) throw new Error(`Item ${i + 1} has an invalid product.`);
      const quantity = it?.quantity;
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) throw new Error(`Item ${i + 1} quantity must be 1-20.`);
      const size = text(String(it?.size ?? ''), `Item ${i + 1} size`, 12);
      const cust = it?.customization ?? {};
      const customName = clean(cust.name).toUpperCase();
      const customNumber = clean(cust.number);
      if (customName.length > 14) throw new Error(`Item ${i + 1} name is too long.`);
      if (customNumber && !/^\d{1,2}$/.test(customNumber)) throw new Error(`Item ${i + 1} number must be 1-2 digits.`);
      const fontImage = typeof cust.font === 'string' ? cust.font : cust.font?.image ?? '';
      if (!fontImage && (customName || customNumber)) throw new Error(`Choose a font for item ${i + 1}.`);
      const patches = (Array.isArray(it?.patch) ? it.patch : it?.patch ? [it.patch] : []).map((p) => (typeof p === 'string' ? p : p?.image)).filter(Boolean);
      if (patches.length > 4 || new Set(patches).size !== patches.length) throw new Error(`Item ${i + 1} has invalid patches.`);
      return { productId, quantity, size, customName, customNumber, fontImage, patches };
    });

    // double-click / double-submit guard: same phone in the last 3 minutes -> return that order
    const dup = await findRecentDuplicate(phone, 3 * 60_000);
    if (dup) return { success: true, orderId: dup.orderNo, status: 'pending' };

    const products = new Map();
    await Promise.all([...new Set(requested.map((r) => r.productId))].map(async (id) => products.set(id, await loadProduct(id))));

    const orderItems = requested.map((r) => {
      const p = products.get(r.productId);
      if (!p) throw new Error('A product in your cart no longer exists.');
      if (!Array.isArray(p.size) || !p.size.includes(r.size)) throw new Error(`${p.title} does not have size ${r.size}.`);
      const base = Number(p.price);
      if (!Number.isFinite(base) || base < 0) throw new Error(`${p.title} has an invalid price.`);
      let font = null;
      if (r.fontImage) {
        if (p.font !== true) throw new Error(`${p.title} does not offer custom fonts.`);
        font = priced(p.fontsImg, r.fontImage, 'font');
      }
      if (r.patches.length && p.patch !== true) throw new Error(`${p.title} does not offer patches.`);
      const patches = r.patches.map((img) => priced(p.patchsImg, img, 'patch'));
      const unit = money(base + (font?.price ?? 0) + patches.reduce((s, x) => s + x.price, 0));
      return {
        productId: r.productId, title: p.title, image: p.imagesLink?.[0] ?? '', size: r.size, quantity: r.quantity,
        basePrice: money(base), font, patches, customization: { name: r.customName, number: r.customNumber },
        unitPrice: unit, lineTotal: money(unit * r.quantity),
      };
    });

    // atomic stock check + decrement (Express/Mongo)
    const demand = orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const stock = await reserveStock(demand, { strict: true });
    if (!stock.ok) return bad(stock.error);
    reserved = demand;

    const subtotal = money(orderItems.reduce((s, i) => s + i.lineTotal, 0));
    const deliveryFee = getDeliveryFee(area);
    const total = money(subtotal + deliveryFee);
    const now = new Date().toISOString();

    const saved = await appendOrder({
      id: randomUUID(), createdAt: now, date: todayDhaka(), orderNo: makeOrderNo(), source: 'Website', addedBy: 'website', moderatorId: '',
      customerName: name, phone, phone2, address, deliveryArea: area,
      items: itemsSummary(orderItems.map((i) => ({ title: i.title, size: i.size, quantity: i.quantity, customization: i.customization }))),
      itemsJson: JSON.stringify(orderItems),
      subtotal, deliveryFee, total, advance: 0, advanceAccount: '', cod: total,
      status: 'Pending', note, courierId: '', trackingCode: '', courierStatus: '', courierSyncedAt: '', courierError: '',
      riderName: '', riderPhone: '', riderNote: '', riderResolved: 'NO',
      deliveryDate: '', commissionRate: 0, deliveryCommission: 0, reviewSent: 'NO', updatedAt: now,
    });
    reserved = null; // order saved -> stock stays reserved

    // Steadfast runs AFTER the response, so the customer never waits for it
    after(async () => {
      try {
        const settings = await getSettings();
        if (courierEnabled(settings)) await dispatchToSteadfast(saved, settings);
      } catch (e) {
        console.error('Steadfast dispatch failed:', e);
      }
    });

    return { success: true, orderId: saved.orderNo, status: 'pending' };
  } catch (e) {
    if (reserved) await releaseStock(reserved);
    const known = /must be|invalid|no longer|does not|Choose|Enter/i.test(String(e?.message));
    if (!known) console.error('submitOrder failed:', e);
    return bad(known ? e.message : 'Could not place your order. Please try again.');
  }
}
