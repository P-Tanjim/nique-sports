import { assertAdmin } from '@/lib/admin/guard';

// Fetch helpers for the /admin routes on the Express server.
//
// Deliberately NOT a 'use server' file: nothing in here becomes a callable
// server action. Every helper checks the signed-in user is an admin first,
// then adds the shared secret that the Express server requires. The secret
// (ADMIN_API_KEY) is a plain server env var, never NEXT_PUBLIC_, so it can't
// reach the browser.
const API = process.env.API;

function adminHeaders(extra) {
  return { 'x-admin-key': process.env.ADMIN_API_KEY ?? '', ...extra };
}

// Returns the parsed JSON, or null on any failure (same contract as serverFetch).
export async function adminFetch(path, options = {}) {
  try {
    await assertAdmin();
    const res = await fetch(`${API}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      ...options,
      headers: adminHeaders(options.headers),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    if (error?.message !== 'UNAUTHORIZED') console.error('adminFetch failed:', error);
    return null;
  }
}

// Returns { success, data } or { success: false, error } (same contract as serverPost/Put/Delete).
async function adminMutation(method, path, body) {
  try {
    await assertAdmin();
    const hasBody = body !== undefined;
    const res = await fetch(`${API}${path}`, {
      method,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
      headers: adminHeaders(hasBody ? { 'Content-Type': 'application/json' } : undefined),
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data?.error || 'Request failed.' };
    return { success: true, data: data.data };
  } catch (error) {
    if (error?.message === 'UNAUTHORIZED') return { success: false, error: 'You are not allowed to do this.' };
    console.error('adminMutation failed:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export const adminPost = (path, body) => adminMutation('POST', path, body);
export const adminPut = (path, body) => adminMutation('PUT', path, body);
export const adminDelete = (path) => adminMutation('DELETE', path);
