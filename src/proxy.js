import { NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// First, cheap gate: no session cookie at all means no reason to render
// anything under /dashboard. This only checks that a cookie EXISTS — it is not
// proof of admin rights. The real check (userRole === 'admin', read fresh from the
// database) happens in requireAdmin() in the dashboard layout/pages and in
// assertAdmin() inside every admin data call and server action.
//
// Next.js 16 calls this file "proxy" (it was "middleware" in Next 15 and
// earlier). If your Next version still expects src/middleware.js, rename the
// file and the exported function to `middleware`.
export function proxy(request) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
