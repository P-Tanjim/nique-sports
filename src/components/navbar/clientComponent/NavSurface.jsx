'use client';

import { usePathname } from 'next/navigation';
import { isAdminPath } from '@/components/navbar/adminNav';

// The sticky top bar. On the storefront it floats over the page like before;
// in the admin area it gets a plain white background and a hairline border so
// dashboard content doesn't scroll underneath the links.
export default function NavSurface({ children }) {
  const pathname = usePathname();
  const admin = isAdminPath(pathname);

  return (
    <nav
      className={`px-4 md:px-20 py-3 w-full flex flex-col sticky top-0 z-50 ${
        admin ? 'border-b border-border bg-white/90 backdrop-blur' : ''
      }`}
    >
      {children}
    </nav>
  );
}
