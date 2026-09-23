'use server'

import { serverFetch } from '../core/core';

// ---------------------------------------------------------------
// Admin dashboard data. Each function is a thin wrapper around your
// Express API — swap the path for your real route. serverFetch
// already returns null on any failure, and dashboard/page.jsx falls
// back to demo data whenever a function returns null/empty, so the
// UI stays intact while you wire the backend up one route at a time.
//
// These hit admin-only data, so once you add auth to serverFetch
// (or write a dedicated adminFetch), route these through it.
// ---------------------------------------------------------------

// GET /admin/dashboard/stats
// Expected shape: { revenue: {value, change, trend}, orders: {...}, customers: {...}, pendingOrders: {...} }
// trend is 'positive' | 'negative' — it's about whether the change is good news, not the arrow direction.
export const getDashboardStats = async () => {
  const res = await serverFetch('/admin/dashboard/stats');
  return res?.data ?? null;
};

// GET /admin/dashboard/revenue?range=7d
// Expected shape: [{ date: 'Mon', revenue: 8400 }, ...]
export const getRevenueOverview = async () => {
  const res = await serverFetch('/admin/dashboard/revenue?range=7d');
  return res?.data ?? null;
};

// GET /admin/orders/recent?limit=6
// Expected shape: [{ id, customer, amount, status, date, items }, ...]
export const getRecentOrders = async () => {
  const res = await serverFetch('/admin/orders/recent?limit=6');
  return res?.data ?? null;
};

// GET /admin/products/top-selling?limit=5
// Expected shape: [{ id, name, category, sold, revenue }, ...]
export const getTopProducts = async () => {
  const res = await serverFetch('/admin/products/top-selling?limit=5');
  return res?.data ?? null;
};

// GET /admin/products/low-stock?threshold=10
// Expected shape: [{ id, name, stock }, ...]
export const getLowStockProducts = async () => {
  const res = await serverFetch('/admin/products/low-stock?threshold=10');
  return res?.data ?? null;
};