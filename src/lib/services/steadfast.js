import 'server-only';
import { clean } from '@/lib/orders/helpers';

const BASE = 'https://portal.packzy.com/api/v1';

async function sf({ apiKey, secretKey }, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Api-Key': apiKey, 'Secret-Key': secretKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.status && Number(data.status) >= 400)) {
    const detail = data.message || data.errors;
    const msg = detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : `Steadfast error ${res.status}`;
    throw new Error(msg.slice(0, 300));
  }
  return data;
}

export async function createParcel(creds, order) {
  const data = await sf(creds, 'POST', '/create_order', {
    invoice: order.orderNo,
    recipient_name: order.customerName.slice(0, 100),
    recipient_phone: order.phone,
    ...(order.phone2 ? { alternative_phone: order.phone2 } : {}),
    recipient_address: order.address.slice(0, 250),
    cod_amount: Number(order.cod) || 0,
    note: clean(order.note).slice(0, 250),
    item_description: clean(order.items).slice(0, 250),
  });
  const c = data.consignment;
  if (!c?.consignment_id) throw new Error('Steadfast did not return a consignment id.');
  return { courierId: String(c.consignment_id), trackingCode: String(c.tracking_code ?? ''), courierStatus: String(c.status ?? 'in_review') };
}

export async function fetchParcelStatus(creds, courierId) {
  const data = await sf(creds, 'GET', `/status_by_cid/${encodeURIComponent(courierId)}`);
  return { raw: String(data.delivery_status ?? ''), data };
}

export const getBalance = (creds) => sf(creds, 'GET', '/get_balance');

// Same mapping as the old Apps Script
export function mapCourierStatus(raw) {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('return')) return 'Returned';
  if (s.includes('deliver')) return 'Delivered';
  return 'Pending';
}

// Best-effort rider info from a status/webhook payload
export function extractRider(obj = {}) {
  const msg = clean(obj.tracking_message ?? obj.message ?? obj.note ?? '');
  const phone = clean(obj.rider_phone ?? obj.rider_mobile ?? '') || (/(?:\+?88)?(01[3-9]\d{8})/.exec(msg)?.[1] ?? '');
  const name = clean(obj.rider_name ?? '');
  const note = clean(obj.rider_note ?? obj.rider_issue ?? '') ||
    (/(not received|not picked|unreachable|no answer|didn'?t pick|phone (?:off|busy)|customer .*(?:unavailable|refus)|reschedul|address)/i.test(msg) ? msg : '');
  return { riderName: name, riderPhone: phone, riderNote: note.slice(0, 500) };
}
