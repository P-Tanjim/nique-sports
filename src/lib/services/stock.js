import 'server-only';
import { ObjectId } from 'mongodb';
import { db } from '@/lib/auth';

const API = (process.env.API || 'http://127.0.0.1:5000').replace('localhost', '127.0.0.1');

async function callStockApi(path, items) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': process.env.ADMIN_API_KEY ?? '' },
      body: JSON.stringify({ items }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error || 'Stock update failed.' };
  } catch (err) {
    console.error(`Stock API call (${path}) failed:`, err);
    return { ok: false, error: 'Could not reach the stock service.' };
  }
}

function parseDemand(items) {
  if (!Array.isArray(items) || items.length === 0) return new Map();
  const totals = new Map();
  for (const it of items) {
    if (!it?.productId) continue;
    const id = String(it.productId).trim();
    if (!/^[a-f\d]{24}$/i.test(id)) continue;
    const q = Number(it.quantity) || 1;
    if (q > 0) totals.set(id, (totals.get(id) ?? 0) + q);
  }
  return totals;
}

export async function reserveStock(items, { strict = false } = {}) {
  const totals = parseDemand(items);
  if (totals.size === 0) return { ok: true };

  // 1. Direct MongoDB update
  try {
    const productsColl = db.collection('products');

    // Strict validation for storefront checkout
    if (strict) {
      for (const [id, qty] of totals) {
        const prod = await productsColl.findOne({ _id: new ObjectId(id) });
        if (!prod || typeof prod.stock !== 'number' || prod.stock < qty) {
          return {
            ok: false,
            error: `"${prod?.title || 'An item'}" no longer has enough stock. Please review your cart.`,
          };
        }
      }
    }

    // Decrement stock in MongoDB safely
    for (const [id, qty] of totals) {
      const prod = await productsColl.findOne({ _id: new ObjectId(id) });
      if (!prod) continue;
      if (typeof prod.stock === 'number') {
        const nextStock = Math.max(0, prod.stock - qty);
        await productsColl.updateOne(
          { _id: new ObjectId(id) },
          { $set: { stock: nextStock } }
        );
      }
    }

    return { ok: true };
  } catch (dbErr) {
    console.error('Direct MongoDB stock reservation failed, trying API fallback:', dbErr);
    const apiRes = await callStockApi('/admin/stock/decrement', items);
    if (!strict && !apiRes.ok) {
      console.warn('Non-strict stock reservation error ignored for manual order:', apiRes.error);
      return { ok: true, warning: apiRes.error };
    }
    return apiRes;
  }
}

export async function releaseStock(items) {
  const totals = parseDemand(items);
  if (totals.size === 0) return { ok: true };

  try {
    const productsColl = db.collection('products');
    for (const [id, qty] of totals) {
      await productsColl.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { stock: qty } }
      );
    }
    return { ok: true };
  } catch (dbErr) {
    console.error('Direct MongoDB releaseStock failed, trying API fallback:', dbErr);
    return callStockApi('/admin/stock/restock', items);
  }
}
