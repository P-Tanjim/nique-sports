'use server';

import { revalidatePath } from 'next/cache';
import { ACCOUNTS, ACCOUNT_KEY } from '@/lib/orders/constants';
import { clean, isIsoDate, money, todayDhaka } from '@/lib/orders/helpers';
import { UserError } from '@/lib/orders/validate';
import { assertAdmin } from '@/lib/admin/guard';
import { readObjects } from '@/lib/sheets/client';
import { addTransactions, moderatorBills, newTx, removeTransaction } from '@/lib/sheets/finance';
import { listModerators } from '@/lib/services/moderators';
import { saveSettings } from '@/lib/sheets/settings';

// Finance writes are ADMIN ONLY. Same export names as the old file, so the existing forms keep working.

const MAX = 100_000_000;

async function run(fn) {
  try {
    const result = await fn();
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/finance');
    return result;
  } catch (e) {
    if (e instanceof UserError) return { success: false, error: e.message };
    if (e?.message === 'UNAUTHORIZED') return { success: false, error: 'You are not allowed to do this.' };
    console.error('finance action failed:', e);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

const account = (v, label) => { if (!ACCOUNTS.includes(v)) throw new UserError(`Choose a valid ${label} account.`); return v; };
function amountOf(v, label = 'Amount') {
  const n = money(v);
  if (!(n > 0) || n > MAX) throw new UserError(`${label} must be greater than 0.`);
  return n;
}
function dateOf(v) {
  const d = clean(v) || todayDhaka();
  if (!isIsoDate(d)) throw new UserError('Enter a valid date.');
  return d;
}

export async function addMoneyIn(p) {
  return run(async () => {
    await assertAdmin();
    await addTransactions([newTx({ date: dateOf(p?.date), type: 'money_in', to: account(p?.account, 'deposit'), amount: amountOf(p?.amount), note: clean(p?.note).slice(0, 300) })]);
    return { success: true };
  });
}

export async function addExpenses(p) {
  return run(async () => {
    await assertAdmin();
    const date = dateOf(p?.date);
    const rows = Array.isArray(p?.rows) ? p.rows : [];
    if (rows.length < 1 || rows.length > 50) throw new UserError('Add between 1 and 50 expenses.');
    const txs = [];
    rows.forEach((r, i) => {
      const name = clean(r?.name).slice(0, 200);
      if (!name && !money(r?.amount)) return; // untouched row
      if (!name) throw new UserError(`Expense ${i + 1} needs a description.`);
      txs.push(newTx({ date, type: 'expense', from: account(r?.paidFrom, `expense ${i + 1} paid-from`), amount: amountOf(r?.amount, `Expense ${i + 1} amount`), note: name }));
    });
    if (!txs.length) throw new UserError('Add at least one expense.');
    await addTransactions(txs);
    return { success: true, count: txs.length };
  });
}

export async function addTransfer(p) {
  return run(async () => {
    await assertAdmin();
    const from = account(p?.from, 'source');
    const to = account(p?.to, 'destination');
    if (from === to) throw new UserError('Choose two different accounts.');
    await addTransactions([newTx({ date: dateOf(p?.date), type: 'transfer', from, to, amount: amountOf(p?.amount), note: clean(p?.note).slice(0, 300) })]);
    return { success: true };
  });
}

export async function saveOpeningBalances(p) {
  return run(async () => {
    await assertAdmin();
    const patch = {};
    for (const [name, key] of Object.entries(ACCOUNT_KEY)) {
      const n = money(p?.[key]);
      if (n < 0 || n > MAX) throw new UserError(`Opening ${name} balance must be between 0 and ${MAX}.`);
      patch[`Opening ${name} Balance`] = n;
    }
    await saveSettings(patch);
    return { success: true };
  });
}

export async function deleteTransaction(id) {
  return run(async () => {
    await assertAdmin();
    if (!(await removeTransaction(clean(id)))) throw new UserError('Entry not found.');
    return { success: true };
  });
}

// Admin pays (part of) a moderator's due. Cannot overpay.
export async function payModerator(p) {
  return run(async () => {
    await assertAdmin();
    const mods = await listModerators();
    const mod = mods.find((m) => m.id === clean(p?.moderatorId));
    if (!mod) throw new UserError('Choose a moderator.');
    const amount = amountOf(p?.amount);
    const from = account(p?.account, 'payment');

    const { orders, transactions } = await readObjects(['orders', 'transactions']);
    const bill = moderatorBills(orders, transactions, [mod])[0];
    if (amount > bill.remaining) throw new UserError(`${mod.name}'s due is only ${bill.remaining}৳.`);

    await addTransactions([newTx({ date: dateOf(p?.date), type: 'moderator_payment', from, amount, reference: mod.id, note: `Moderator Payment to ${mod.name}` })]);
    return { success: true };
  });
}
