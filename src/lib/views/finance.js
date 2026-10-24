import 'server-only';
import { TX_LABEL } from '@/lib/orders/constants';
import { readObjects } from '@/lib/sheets/client';
import { computeBalances, moderatorBills, openingFrom, round2, serializeTx } from '@/lib/sheets/finance';
import { toMap } from '@/lib/sheets/settings';
import { listModerators } from '@/lib/services/moderators';

const inRange = (d, from, to) => (!from || d >= from) && (!to || d <= to);

// Admin: balances + cash flow + ledger + what each moderator is owed. ONE sheet call.
export async function loadAdminFinance({ from, to, type, q, limit }) {
  const [{ transactions, settings, orders }, mods] = await Promise.all([readObjects(['transactions', 'settings', 'orders']), listModerators()]);
  const map = toMap(settings);
  const opening = openingFrom(map);
  const balances = computeBalances(opening, transactions);

  const period = transactions.filter((t) => inRange(t.date, from, to));
  const sum = (types) => round2(period.filter((t) => types.includes(t.type)).reduce((s, t) => s + t.amount, 0));
  const moneyIn = sum([TX_LABEL.money_in]);
  const expense = sum([TX_LABEL.expense, TX_LABEL.moderator_payment]);

  const needle = (q ?? '').toLowerCase();
  const ledger = period
    .filter((t) => (!type || t.type === TX_LABEL[type]) && (!needle || [t.note, t.reference, t.from, t.to].some((v) => String(v).toLowerCase().includes(needle))))
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1))
    .slice(0, limit)
    .map(serializeTx);

  return {
    summary: { balances, opening, period: { from, to, moneyIn, expense, transfers: sum([TX_LABEL.transfer]), net: round2(moneyIn - expense) } },
    transactions: ledger,
    bills: moderatorBills(orders, transactions, mods),
  };
}

// Moderator: own orders, earnings in range, bill (earned / paid / due)
export async function loadModeratorFinance(user, { from, to }) {
  const { orders: all, transactions } = await readObjects(['orders', 'transactions']);
  const mine = all.filter((o) => o.moderatorId === user.id);
  const paidTx = transactions.filter((t) => t.type === TX_LABEL.moderator_payment && t.reference === user.id);

  const earnedAll = round2(mine.filter((o) => o.status === 'Delivered').reduce((s, o) => s + o.deliveryCommission, 0));
  const paidAll = round2(paidTx.reduce((s, t) => s + t.amount, 0));

  const rangeOrders = mine.filter((o) => inRange(o.date, from, to));
  const deliveredRows = mine
    .filter((o) => o.status === 'Delivered' && inRange(o.deliveryDate, from, to))
    .sort((a, b) => (a.deliveryDate < b.deliveryDate ? 1 : -1))
    .map((o) => ({ id: o.id, orderNo: o.orderNo, customerName: o.customerName, deliveryDate: o.deliveryDate, commission: o.deliveryCommission }));

  return {
    summary: {
      orders: rangeOrders.length,
      pending: rangeOrders.filter((o) => o.status === 'Pending').length,
      delivered: rangeOrders.filter((o) => o.status === 'Delivered').length,
      cancelled: rangeOrders.filter((o) => o.status === 'Cancelled' || o.status === 'Returned').length,
      earned: round2(deliveredRows.reduce((s, r) => s + r.commission, 0)),
    },
    bill: { earned: earnedAll, paid: paidAll, remaining: round2(Math.max(0, earnedAll - paidAll)) },
    deliveredRows,
    payments: paidTx.filter((t) => inRange(t.date, from, to)).sort((a, b) => (a.date < b.date ? 1 : -1)).map(serializeTx),
  };
}
