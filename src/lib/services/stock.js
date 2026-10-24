import 'server-only';

// Stock lives in MongoDB (Express). Orders live in the sheet. These two calls keep them in sync.
const API = process.env.API;

async function call(path, items) {
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
  } catch {
    return { ok: false, error: 'Could not reach the stock service.' };
  }
}

export const reserveStock = (items) => call('/admin/stock/decrement', items);
export const releaseStock = (items) => call('/admin/stock/restock', items);
