import 'server-only';
import { FINAL_COURIER } from '@/lib/orders/constants';
import { isOn } from '@/lib/orders/helpers';
import { patchOrder, patchOrders, readOrders, statusPatch } from '@/lib/sheets/orders';
import { courierEnabled, getSettings, steadfastCreds } from '@/lib/sheets/settings';
import { createParcel, extractRider, fetchParcelStatus, mapCourierStatus } from './steadfast';

// Sends one order to Steadfast and stores the result (or the error) on the row.
export async function dispatchToSteadfast(order, settings) {
  if (order.courierId) return { ok: true, skipped: true };
  if (!courierEnabled(settings)) return { ok: false, error: 'Steadfast is not enabled in Settings.' };
  try {
    const parcel = await createParcel(steadfastCreds(settings), order);
    await patchOrder(order, { ...parcel, courierSyncedAt: new Date().toISOString(), courierError: '' });
    return { ok: true, ...parcel };
  } catch (e) {
    const error = String(e.message || e).slice(0, 300);
    await patchOrder(order, { courierError: error }).catch(() => {});
    return { ok: false, error };
  }
}

// Builds the sheet patch for a new Steadfast status (shared by polling + webhook)
export function courierPatch(order, rawStatus, riderSource) {
  const patch = { courierStatus: rawStatus, courierSyncedAt: new Date().toISOString(), courierError: '' };
  const next = mapCourierStatus(rawStatus);
  if (next !== order.status && order.status !== 'Cancelled') Object.assign(patch, statusPatch(order, next));
  if (riderSource) {
    const r = extractRider(riderSource);
    if (r.riderName && r.riderName !== order.riderName) patch.riderName = r.riderName;
    if (r.riderPhone && r.riderPhone !== order.riderPhone) patch.riderPhone = r.riderPhone;
    if (r.riderNote && r.riderNote !== order.riderNote) { patch.riderNote = r.riderNote; patch.riderResolved = 'NO'; }
  }
  return patch;
}

async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (i < list.length) { const idx = i++; out[idx] = await fn(list[idx]); }
  }));
  return out;
}

let lastSync = 0;
let syncing = null;

// Polls Steadfast for every open parcel, writes ALL changes in ONE sheet call.
// Throttled to once / 2 min per server instance unless forced.
export async function syncCourierStatuses({ force = false } = {}) {
  const settings = await getSettings();
  if (!courierEnabled(settings)) return [];
  if (!force && (!isOn(settings['Auto Courier Sync']) || Date.now() - lastSync < 120_000)) return [];
  if (syncing) return syncing;

  syncing = (async () => {
    lastSync = Date.now();
    const creds = steadfastCreds(settings);
    const open = (await readOrders())
      .filter((o) => o.courierId && !FINAL_COURIER.includes(o.courierStatus) && o.status !== 'Cancelled')
      .slice(-80);

    const results = await mapLimit(open, 5, async (order) => {
      try {
        const { raw, data } = await fetchParcelStatus(creds, order.courierId);
        if (!raw) return null;
        const patch = courierPatch(order, raw, data);
        return raw === order.courierStatus && Object.keys(patch).length <= 3 ? null : { order, patch };
      } catch {
        return null;
      }
    });

    const changed = results.filter(Boolean);
    await patchOrders(changed);
    return changed.map(({ order, patch }) => ({ ...order, ...patch }));
  })().finally(() => { syncing = null; });

  return syncing;
}
