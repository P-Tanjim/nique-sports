import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// Reads the signed-in user straight from Better Auth (database-backed, so a role
// change or deleted session takes effect immediately). Memoised per request.
const getSessionUser = cache(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
  } catch {
    return null; // fail closed
  }
});

const isStaffRole = (r) => r === 'admin' || r === 'moderator';

export async function getAdminUser() {
  const user = await getSessionUser();
  return user?.userRole === 'admin' ? user : null;
}

// admin OR moderator
export async function getStaffUser() {
  const user = await getSessionUser();
  return user && isStaffRole(user.userRole) ? user : null;
}

// Pages/layouts: signed out -> /sign-in, signed in but not allowed -> plain 404.
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect('/sign-in');
  if (user.userRole !== 'admin') notFound();
  return user;
}

export async function requireStaff() {
  const user = await getSessionUser();
  if (!user) redirect('/sign-in');
  if (!isStaffRole(user.userRole)) notFound();
  return user;
}

// Data calls / server actions: throw instead of redirecting.
export async function assertAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error('UNAUTHORIZED');
  return admin;
}

export async function assertStaff() {
  const staff = await getStaffUser();
  if (!staff) throw new Error('UNAUTHORIZED');
  return staff;
}
