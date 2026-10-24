import 'server-only';
import { appendObjects, findRowById, patchCells, readColumns, readObjects } from './client';
import { todayDhaka } from '@/lib/orders/helpers';
import { db } from '@/lib/auth';

function toOrderDoc(order) {
  let parsedItems = [];
  try {
    parsedItems = order.itemsJson ? JSON.parse(order.itemsJson) : [];
  } catch {
    parsedItems = [];
  }

  const { _row, ...rest } = order;
  return {
    ...rest,
    items: parsedItems,
    itemsSummary: order.items || '',
    itemsJson: order.itemsJson || '',
    subtotal: Number(order.subtotal) || 0,
    deliveryFee: Number(order.deliveryFee) || 0,
    total: Number(order.total) || 0,
    advance: Number(order.advance) || 0,
    cod: Number(order.cod) || 0,
    commissionRate: Number(order.commissionRate) || 0,
    deliveryCommission: Number(order.deliveryCommission) || 0,
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
  };
}

export async function saveOrderToDatabase(order) {
  try {
    const doc = toOrderDoc(order);
    await db.collection('orders').updateOne(
      { $or: [{ id: order.id }, { orderNo: order.orderNo }] },
      { $set: doc },
      { upsert: true }
    );
  } catch (err) {
    console.error('Failed to save order to MongoDB database:', err);
  }
}

export async function patchOrderInDatabase(order, patch) {
  try {
    const update = { ...patch, updatedAt: new Date() };
    if (patch.itemsJson) {
      try {
        update.items = JSON.parse(patch.itemsJson);
      } catch {}
    }
    await db.collection('orders').updateOne(
      { $or: [{ id: order.id }, { orderNo: order.orderNo }] },
      { $set: update }
    );
  } catch (err) {
    console.error('Failed to patch order in MongoDB database:', err);
  }
}

export async function patchOrdersInDatabase(list) {
  try {
    if (!list?.length) return;
    const ops = list.map(({ order, patch }) => {
      const update = { ...patch, updatedAt: new Date() };
      if (patch.itemsJson) {
        try {
          update.items = JSON.parse(patch.itemsJson);
        } catch {}
      }
      return {
        updateOne: {
          filter: { $or: [{ id: order.id }, { orderNo: order.orderNo }] },
          update: { $set: update },
        },
      };
    });
    await db.collection('orders').bulkWrite(ops, { ordered: false });
  } catch (err) {
    console.error('Failed to bulk patch orders in MongoDB database:', err);
  }
}

export async function syncOrdersToDatabase(orders) {
  if (!orders?.length) return;
  try {
    const ops = orders.map((o) => ({
      updateOne: {
        filter: { $or: [{ id: o.id }, { orderNo: o.orderNo }] },
        update: { $set: toOrderDoc(o) },
        upsert: true,
      },
    }));
    await db.collection('orders').bulkWrite(ops, { ordered: false });
  } catch (err) {
    console.error('Failed to sync orders from sheet to MongoDB database:', err);
  }
}

export async function readOrders() {
  try {
    const { orders } = await readObjects(['orders']);
    if (orders?.length) {
      syncOrdersToDatabase(orders).catch(() => {});
    }
    return orders;
  } catch (sheetError) {
    console.error('Google Sheets readOrders failed, falling back to MongoDB:', sheetError);
    try {
      const dbOrders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
      return dbOrders.map((doc) => {
        const { _id, items, ...rest } = doc;
        return {
          ...rest,
          createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || ''),
          updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt || ''),
          items: doc.itemsSummary || (Array.isArray(items) ? items.map((i) => i.title).join(', ') : String(items || '')),
          itemsJson: doc.itemsJson || JSON.stringify(items || []),
        };
      });
    } catch {
      throw sheetError;
    }
  }
}

export async function findOrder(id) {
  const orders = await readOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function appendOrder(order) {
  // Persist directly in MongoDB database
  await saveOrderToDatabase(order);

  // Append to Google Sheet
  const row = await appendObjects('orders', [order]);
  return { ...order, _row: row };
}

export async function patchOrder(order, patch) {
  // Update in MongoDB database
  await patchOrderInDatabase(order, patch);

  // Update in Google Sheet
  const row = order._row ?? (await findRowById('orders', order.id));
  if (!row) throw new Error('Order row not found.');
  await patchCells([{ tabKey: 'orders', row, patch: { ...patch, updatedAt: new Date().toISOString() } }]);
  return { ...order, ...patch };
}

export async function patchOrders(list) {
  if (!list.length) return;
  // Bulk update in MongoDB database
  await patchOrdersInDatabase(list);

  // Bulk update in Google Sheet
  const now = new Date().toISOString();
  await patchCells(list.map(({ order, patch }) => ({ tabKey: 'orders', row: order._row, patch: { ...patch, updatedAt: now } })));
}

// Same phone within `withinMs` -> likely a double submit / duplicate order
export async function findRecentDuplicate(phone, withinMs) {
  const cols = await readColumns('orders', ['createdAt', 'phone', 'orderNo', 'status']);
  const since = Date.now() - withinMs;
  for (let i = cols.phone.length - 1; i >= 0; i -= 1) {
    const t = Date.parse(cols.createdAt[i]);
    if (Number.isNaN(t) || t < since) {
      if (!Number.isNaN(t)) break;
      continue;
    }
    if (String(cols.phone[i]) === String(phone) && cols.status[i] !== 'Cancelled') {
      return { orderNo: cols.orderNo[i], createdAt: cols.createdAt[i] };
    }
  }
  return null;
}

// Order a client may safely see (no raw JSON column, parsed items, flags)
export function toPublicOrder(o) {
  let items = [];
  try { items = o.itemsJson ? JSON.parse(o.itemsJson) : []; } catch { items = []; }
  const { _row, itemsJson, ...rest } = o;
  return {
    ...rest,
    items,
    isWebsite: items.some((i) => i.productId),
    riderIssue: Boolean(o.riderNote) && o.riderResolved !== 'YES',
  };
}

export const isAdminUser = (u) => u?.userRole === 'admin';

export function visibleOrders(user, orders) {
  return isAdminUser(user) ? orders : orders.filter((o) => o.moderatorId === user.id);
}

export function canEditOrder(user, order) {
  if (isAdminUser(user)) return true;
  return order.moderatorId === user.id && order.status === 'Pending';
}

// status change side effects: delivery date + moderator commission (same rule as the old app)
export function statusPatch(order, next) {
  const patch = { status: next };
  if (next === 'Delivered' && order.status !== 'Delivered') {
    patch.deliveryDate = todayDhaka();
    patch.deliveryCommission = Number(order.commissionRate) || 0;
  } else if (next !== 'Delivered' && order.status === 'Delivered') {
    patch.deliveryDate = '';
    patch.deliveryCommission = 0;
  }
  return patch;
}

import { randomBytes } from 'node:crypto';

// NS-261018-A1B2C3  (also used as the Steadfast invoice id, must be unique)
export function makeOrderNo(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replaceAll('-', '');
  return `NS-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
}
