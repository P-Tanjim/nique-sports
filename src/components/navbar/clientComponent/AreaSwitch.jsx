'use client';

import { usePathname } from 'next/navigation';
import { isAdminPath } from '@/components/navbar/adminNav';

// Renders `admin` on /dashboard routes and `store` everywhere else. Both are
// server-rendered elements handed in as props, so the storefront navbar keeps
// working exactly as before and the root layout stays static (it never has to
// read the session).
export default function AreaSwitch({ store, admin = null }) {
  const pathname = usePathname();
  return isAdminPath(pathname) ? admin : store;
}
