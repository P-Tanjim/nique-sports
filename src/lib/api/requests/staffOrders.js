'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { ORDER_STATUSES } from '@/lib/orders/constants';
import { clean, itemsSummary, normalizePhone } from '@/lib/orders/helpers';
import { UserError, validateOrderInput } from '@/lib/orders/validate';
import { rateLimit } from '@/lib/rateLimit';
import { assertAdmin, assertStaff } from '@/lib/admin/guard';
import { readObjects } from '@/lib/sheets/client';
import { addTransactions, newTx, syncAdvanceTx } from '@/lib/sheets/finance';
import {
  appendOrder, canEditOrder, findOrder, findRecentDuplicate, isAdminUser, makeOrderNo,
  patchOrder, readOrders, statusPatch, toPublicOrder, visibleOrders,
} from '@/lib/sheets/orders';
import { aiEnabled, courierEnabled, geminiCreds, getSettings } from '@/lib/sheets/settings';
import { dispatchToSteadfast, syncCourierStatuses } from '@/lib/services/courier';
import { parseOrderWithGemini } from '@/lib/services/gemini';
import { resolveAssignee } from '@/lib/services/moderators';
import { releaseStock, reserveStock } from '@/lib/services/stock';

// Every export below is a public endpoint -> each one checks the session itself.

async function run(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof UserError) return { success: false, error: e.message };
    if (e?.message === 'UNAUTHORIZED') return { success: false, error: 'You are not allowed to do this.' };
    console.error('staff order action failed:', e);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

const refresh = () => { revalidatePath('/dashboard'); revalidatePath('/dashboard/orders'); revalidatePath('/dashboard/finance'); };
const newestFirst = (list) => [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

async function loadEditable(user, id) {
  const order = await findOrder(clean(id));
  if (!order) throw new UserError('Order not found.');
  if (!canEditOrder(user, order)) throw new UserError('You cannot change this order.');
  return order;
}

/* ------------------------------ create / edit ------------------------------ */

export async function createManualOrder(input, opts = {}) {
  return run(async () => {
    const user = await assertStaff();
    const v = validateOrderInput(input);
    const settings = await getSettings();
    const assignee = await resolveAssignee(user, v.assigneeId);

    if (!opts.confirmDuplicate) {
      const dup = await findRecentDuplicate(v.phone, 48 * 3600_000);
      if (dup) return { success: false, duplicate: dup, error: `This phone already ordered recently (${dup.orderNo}).` };
    }

    // Atomic stock check + decrement for items that have a productId
    const demand = v.items
      .filter((i) => i.productId)
      .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 1 }));

    let reserved = null;
    if (demand.length > 0) {
      const stock = await reserveStock(demand);
      if (!stock.ok) return { success: false, error: stock.error };
      reserved = demand;
    }

    const now = new Date().toISOString();
    const orderNo = makeOrderNo();
    const draft = {
      id: randomUUID(), orderId: orderNo, createdAt: now, date: v.date, orderNo, source: v.source,
      addedBy: assignee.name, moderatorId: assignee.id,
      customerName: v.customerName, phone: v.phone, phone2: v.phone2, address: v.address, deliveryArea: '',
      items: itemsSummary(v.items), itemsJson: JSON.stringify(v.items),
      subtotal: v.items.reduce((sum, it) => sum + (Number(it.lineTotal) || 0), 0),
      deliveryFee: 0,
      total: v.cod + v.advance,
      advance: v.advance, advanceAccount: v.advanceAccount, cod: v.cod,
      status: 'Pending', note: v.note,
      courierId: '', trackingCode: '', courierStatus: '', courierSyncedAt: '', courierError: '',
      riderName: '', riderPhone: '', riderNote: '', riderResolved: 'NO',
      deliveryDate: '', commissionRate: assignee.commissionRate, deliveryCommission: 0,
      reviewSent: 'NO', updatedAt: now,
    };

    let saved;
    try {
      saved = await appendOrder(draft);
      reserved = null; // Successfully saved -> stock stays decremented
    } catch (err) {
      if (reserved) await releaseStock(reserved).catch(() => {});
      throw err;
    }

    if (v.advance > 0) {
      await addTransactions([newTx({ date: v.date, type: 'money_in', to: v.advanceAccount, amount: v.advance, reference: saved.id, note: `Order Advance - ${saved.orderNo}` })]);
    }

    let courier = null;
    if (v.sendToCourier && courierEnabled(settings)) courier = await dispatchToSteadfast(saved, settings);

    refresh();
    return { success: true, orderNo: saved.orderNo, courier };
  });
}

export async function updateOrder(id, input) {
  return run(async () => {
    const user = await assertStaff();
    const order = await loadEditable(user, id);
    const v = validateOrderInput(input);
    const isWebsite = order.itemsJson.includes('"productId"');

    const patch = {
      date: v.date, customerName: v.customerName, phone: v.phone, phone2: v.phone2, address: v.address,
      note: v.note, source: v.source, advance: v.advance, advanceAccount: v.advanceAccount,
    };
    if (isWebsite) {
      // website orders keep their priced items; COD = fixed total - advance
      patch.cod = Math.max(0, order.total - v.advance);
    } else {
      patch.cod = v.cod;
      patch.total = v.cod + v.advance;
      patch.items = itemsSummary(v.items);
      patch.itemsJson = JSON.stringify(v.items);
    }

    if (isAdminUser(user) && v.assigneeId && v.assigneeId !== order.moderatorId && order.status !== 'Delivered') {
      const a = await resolveAssignee(user, v.assigneeId);
      Object.assign(patch, { addedBy: a.name, moderatorId: a.id, commissionRate: a.commissionRate });
    }

    if (patch.advance !== order.advance || patch.advanceAccount !== order.advanceAccount) {
      const { transactions } = await readObjects(['transactions']);
      await syncAdvanceTx(transactions, order, { advance: patch.advance, account: patch.advanceAccount, date: v.date });
    }

    await patchOrder(order, patch);
    refresh();
    return { success: true, courierWarning: Boolean(order.courierId) };
  });
}

/* ------------------------------ admin-only changes ------------------------------ */

export async function setOrderStatus(id, status) {
  return run(async () => {
    await assertAdmin();
    if (!ORDER_STATUSES.includes(status)) throw new UserError('Unknown status.');
    const order = await findOrder(clean(id));
    if (!order) throw new UserError('Order not found.');
    const patch = statusPatch(order, status);

    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      try {
        let items = [];
        try { items = order.itemsJson ? JSON.parse(order.itemsJson) : []; } catch {}
        const restock = items.filter((i) => i.productId).map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 1 }));
        if (restock.length > 0) {
          await releaseStock(restock);
        }
      } catch (e) {
        console.error('Failed to restock cancelled order:', e);
      }
    }

    await patchOrder(order, patch);
    refresh();
    return { success: true, patch };
  });
}

export async function saveRiderInfo(id, info) {
  return run(async () => {
    await assertAdmin();
    const order = await findOrder(clean(id));
    if (!order) throw new UserError('Order not found.');
    const riderPhone = clean(info?.riderPhone) ? normalizePhone(info.riderPhone) : '';
    if (clean(info?.riderPhone) && !riderPhone) throw new UserError('Rider phone is not valid.');
    const patch = { riderName: clean(info?.riderName).slice(0, 100), riderPhone, riderNote: clean(info?.riderNote).slice(0, 500), riderResolved: 'NO' };
    await patchOrder(order, patch);
    refresh();
    return { success: true, patch };
  });
}

export async function resolveRiderIssue(id) {
  return run(async () => {
    await assertAdmin();
    const order = await findOrder(clean(id));
    if (!order) throw new UserError('Order not found.');
    await patchOrder(order, { riderResolved: 'YES' });
    refresh();
    return { success: true, patch: { riderResolved: 'YES' } };
  });
}

/* ------------------------------ staff actions on visible orders ------------------------------ */

export async function sendOrderToCourier(id) {
  return run(async () => {
    const user = await assertStaff();
    const order = await findOrder(clean(id));
    if (!order || (!isAdminUser(user) && order.moderatorId !== user.id)) throw new UserError('Order not found.');
    const settings = await getSettings();
    if (!courierEnabled(settings)) throw new UserError('Steadfast is not enabled. Turn it on in Settings.');
    const r = await dispatchToSteadfast(order, settings);
    refresh();
    return r.ok ? { success: true, patch: { courierId: r.courierId ?? order.courierId, trackingCode: r.trackingCode ?? order.trackingCode, courierStatus: r.courierStatus ?? order.courierStatus, courierError: '' } } : { success: false, error: r.error };
  });
}

export async function markReviewSent(id) {
  return run(async () => {
    const user = await assertStaff();
    const order = await findOrder(clean(id));
    if (!order || (!isAdminUser(user) && order.moderatorId !== user.id)) throw new UserError('Order not found.');
    if (order.reviewSent !== 'YES') await patchOrder(order, { reviewSent: 'YES' });
    return { success: true };
  });
}

export async function syncCourier({ force = false } = {}) {
  return run(async () => {
    const user = await assertStaff();
    if (force && !rateLimit(`sync:${user.id}`, 6, 60_000)) throw new UserError('Slow down a little.');
    const changed = await syncCourierStatuses({ force });
    if (changed.length) refresh();
    return { success: true, orders: visibleOrders(user, changed).map(toPublicOrder) };
  });
}

export async function fetchAllOrders() {
  return run(async () => {
    const user = await assertStaff();
    const all = visibleOrders(user, await readOrders());
    return { success: true, orders: newestFirst(all).map(toPublicOrder) };
  });
}

export async function parseOrderText(text) {
  return run(async () => {
    const user = await assertStaff();
    if (!rateLimit(`ai:${user.id}`, 20, 5 * 60_000)) throw new UserError('Too many AI requests. Wait a few minutes.');
    const message = clean(text);
    if (message.length < 8) throw new UserError('Paste the customer message first.');
    const settings = await getSettings();
    if (!aiEnabled(settings)) throw new UserError('AI entry is turned off or has no API key (Settings).');
    try {
      return { success: true, data: await parseOrderWithGemini(message, geminiCreds(settings)) };
    } catch (e) {
      throw new UserError(`AI failed: ${String(e.message).slice(0, 160)}`);
    }
  });
}
