import 'server-only';
import { ACCOUNT_KEY, TX_LABEL, TX_TYPE } from '@/lib/orders/constants';
import { money } from '@/lib/orders/helpers';
import { appendObjects, deleteRow, findRowById, patchCells } from './client';

export const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100;

export function serializeTx(t) {
  return {
    id: t.id, date: t.date, type: TX_TYPE[t.type] ?? 'transfer',
    from: t.from, to: t.to, amount: t.amount, reference: t.reference, note: t.note, createdAt: t.createdAt,
  };
}

export function openingFrom(settings) {
  return {
    cash: money(settings['Opening Cash Balance']),
    bank: money(settings['Opening Bank Balance']),
    bkash: money(settings['Opening bKash Balance']),
    nagad: money(settings['Opening Nagad Balance']),
  };
}

export function computeBalances(opening, txs) {
  const b = { ...opening };
  const add = (name, d) => { const k = ACCOUNT_KEY[name]; if (k) b[k] += d; };
  for (const t of txs) {
    const a = Number(t.amount) || 0;
    if (t.type === TX_LABEL.money_in) add(t.to, a);
    else if (t.type === TX_LABEL.expense || t.type === TX_LABEL.moderator_payment) add(t.from, -a);
    else if (t.type === TX_LABEL.transfer) { add(t.from, -a); add(t.to, a); }
  }
  const r = { cash: round2(b.cash), bank: round2(b.bank), bkash: round2(b.bkash), nagad: round2(b.nagad) };
  return { ...r, total: round2(r.cash + r.bank + r.bkash + r.nagad) };
}

export function newTx({ date, type, from = '', to = '', amount, reference = '', note = '' }) {
  return {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), date,
    type: TX_LABEL[type], from, to, amount: round2(amount), reference, note,
  };
}

export const addTransactions = (list) => appendObjects('transactions', list);

export async function removeTransaction(id) {
  const row = await findRowById('transactions', id);
  if (!row) return false;
  await deleteRow('transactions', row);
  return true;
}

// Keeps the "Order Advance" ledger entry in sync when an order's advance changes.
export async function syncAdvanceTx(txs, order, { advance, account, date }) {
  const existing = txs.find((t) => t.reference === order.id && /^Order Advance/.test(t.note));
  const note = `Order Advance - ${order.orderNo}`;
  if (!existing) {
    if (advance > 0 && account) await addTransactions([newTx({ date, type: 'money_in', to: account, amount: advance, reference: order.id, note })]);
    return;
  }
  if (!(advance > 0 && account)) { await removeTransaction(existing.id); return; }
  await patchCells([{ tabKey: 'transactions', row: existing._row, patch: { amount: round2(advance), to: account, date } }]);
}

// earned (all orders added by moderator) - paid (Moderator Payment rows) per moderator id
export function moderatorBills(orders, txs, moderators) {
  const earned = new Map();
  for (const o of orders) {
    if (o.moderatorId) {
      const comm = (Number(o.deliveryCommission) > 0 ? Number(o.deliveryCommission) : Number(o.commissionRate)) || 0;
      earned.set(o.moderatorId, (earned.get(o.moderatorId) ?? 0) + comm);
    }
  }
  const paid = new Map();
  for (const t of txs) {
    if (t.type === TX_LABEL.moderator_payment) paid.set(t.reference, (paid.get(t.reference) ?? 0) + (Number(t.amount) || 0));
  }
  return moderators.map((m) => {
    const e = round2(earned.get(m.id) ?? 0);
    const p = round2(paid.get(m.id) ?? 0);
    return { id: m.id, name: m.name, commission: m.commission, active: m.active, earned: e, paid: p, remaining: round2(Math.max(0, e - p)) };
  });
}
