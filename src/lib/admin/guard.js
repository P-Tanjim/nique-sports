import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// Reads the signed-in user straight from Better Auth (database-backed, so a
// role change or a deleted session takes effect immediately). Memoised per
// request, so calling it from the layout, the page and several data calls
// costs one lookup.
const getSessionUser = cache(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch {
    return null; // fail closed
  }
});

// The user, but only if they are an admin. Otherwise null.
export async function getAdminUser() {
  const user = await getSessionUser();
  return user?.userRole === 'admin' ? user : null;
}

// For pages and layouts. Signed-out visitors go to sign-in; signed-in
// non-admins get a plain 404 so the dashboard does not advertise itself.
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect('/sign-in');
  if (user.userRole !== 'admin') notFound();
  return user;
}

// For data calls and server actions. Throws instead of redirecting.
export async function assertAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error('UNAUTHORIZED');
  return admin;
}
