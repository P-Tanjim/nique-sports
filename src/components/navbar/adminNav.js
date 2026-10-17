import { LayoutDashboard, ReceiptText, Shirt, Wallet } from 'lucide-react';

// Single source of truth for the admin navigation (top bar, side menu and
// mobile bottom bar all read this). Imported by client components only,
// because the icons are components and can't be passed from a server component.
export const ADMIN_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Orders', icon: ReceiptText },
  { href: '/dashboard/products', label: 'Products', icon: Shirt },
  { href: '/dashboard/finance', label: 'Finance', icon: Wallet },
];

// Purely cosmetic: decides which navigation to SHOW. Access to the pages is
// enforced on the server (proxy.js, requireAdmin, assertAdmin).
export function isAdminPath(pathname) {
  return pathname === '/dashboard' || Boolean(pathname?.startsWith('/dashboard/'));
}

export function isActiveAdminLink(link, pathname) {
  if (!pathname) return false;
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
