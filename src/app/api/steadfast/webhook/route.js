import { timingSafeEqual } from 'node:crypto';
import { courierPatch } from '@/lib/services/courier';
import { patchOrder, readOrders } from '@/lib/sheets/orders';
import { getSettings } from '@/lib/sheets/settings';
import { extractRider } from '@/lib/services/steadfast';

// Steadfast -> your site, real-time. In the Steadfast portal set:
//   Callback URL: https://YOUR-DOMAIN/api/steadfast/webhook
//   Auth token:   the same value you saved as "Steadfast Webhook Token" in Settings
export const dynamic = 'force-dynamic';

const ok = () => Response.json({ status: 'success', message: 'Webhook received successfully.' });

function sameToken(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req) {
  const settings = await getSettings();
  const expected = String(settings['Steadfast Webhook Token'] ?? '').trim();
  const provided = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!expected || !sameToken(provided, expected)) return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return Response.json({ status: 'error', message: 'Bad payload' }, { status: 400 });

  const cid = String(body.consignment_id ?? '');
  const invoice = String(body.invoice ?? '');
  const orders = await readOrders();
  const order = orders.find((o) => (cid && o.courierId === cid) || (invoice && o.orderNo === invoice));
  if (!order) return ok(); // not ours (or not saved yet) - acknowledge so Steadfast doesn't retry forever

  if (body.notification_type === 'tracking_update') {
    const r = extractRider(body);
    const patch = {};
    if (r.riderPhone) patch.riderPhone = r.riderPhone;
    if (r.riderNote && r.riderNote !== order.riderNote) Object.assign(patch, { riderNote: r.riderNote, riderResolved: 'NO' });
    if (Object.keys(patch).length) await patchOrder(order, patch);
    return ok();
  }

  const raw = String(body.status ?? '').toLowerCase();
  if (raw) await patchOrder(order, courierPatch(order, raw, body));
  return ok();
}
