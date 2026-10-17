'use server'

import { revalidatePath } from 'next/cache';
import { adminFetch, adminPut } from '../core/adminCore';

// Every call here goes through adminCore: it verifies the signed-in user is
// an admin before anything is sent, and adds the Express API key.

// GET /admin/dashboard/overview?range=14
// -> { range, stats, chart, recentOrders, lowStock }
export const getDashboardOverview = async (range = 14) => {
  const res = await adminFetch(`/admin/dashboard/overview?range=${encodeURIComponent(range)}`);
  return res?.data ?? null;
};

// GET /admin/orders
export const getAllOrders = async () => {
  const res = await adminFetch('/admin/orders', { signal: AbortSignal.timeout(8000) });
  return res?.data ?? null;
};

export const updateOrderStatus = async (id, status) => {
  const result = await adminPut(`/admin/orders/${encodeURIComponent(id)}/status`, { status });

  if (result?.success) {
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');
  }

  return result;
};
