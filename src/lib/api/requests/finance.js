'use server'

import { revalidatePath } from 'next/cache';
import { adminDelete, adminFetch, adminPost, adminPut } from '../core/adminCore';

function toQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

function refreshAdminPages() {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/finance');
}

// -> { balances, opening, period }
export async function getFinanceSummary({ from, to } = {}) {
  const res = await adminFetch(`/admin/finance/summary${toQuery({ from, to })}`);
  return res?.data ?? null;
}

// -> [{ id, date, type, from, to, amount, reference, note }]
export async function getFinanceTransactions({ from, to, type, q, limit } = {}) {
  const res = await adminFetch(`/admin/finance/transactions${toQuery({ from, to, type, q, limit })}`);
  return Array.isArray(res?.data) ? res.data : null;
}

export async function addMoneyIn(payload) {
  const result = await adminPost('/admin/finance/money-in', payload);
  if (result.success) refreshAdminPages();
  return result;
}

export async function addExpenses(payload) {
  const result = await adminPost('/admin/finance/expenses', payload);
  if (result.success) refreshAdminPages();
  return result;
}

export async function addTransfer(payload) {
  const result = await adminPost('/admin/finance/transfer', payload);
  if (result.success) refreshAdminPages();
  return result;
}

export async function saveOpeningBalances(payload) {
  const result = await adminPut('/admin/finance/opening-balances', payload);
  if (result.success) refreshAdminPages();
  return result;
}

export async function deleteTransaction(id) {
  const result = await adminDelete(`/admin/finance/transactions/${encodeURIComponent(id)}`);
  if (result.success) refreshAdminPages();
  return result;
}
