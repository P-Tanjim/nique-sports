'use client';

import { Images, LayoutDashboard, ReceiptText, Settings, Shirt, Wallet } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

// Single source of truth for the admin navigation (top bar, side menu and
// mobile bottom bar all read this). Imported by client components only.
export const ADMIN_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/orders', label: 'Orders', icon: ReceiptText },
  { href: '/dashboard/products', label: 'Products', icon: Shirt },
  { href: '/dashboard/finance', label: 'Finance', icon: Wallet },
];

// admin only (moderators never see it; the page itself also blocks them on the server)
export const BANNERS_LINK = { href: '/dashboard/banners', label: 'Banners', icon: Images };
export const SETTINGS_LINK = { href: '/dashboard/settings', label: 'Settings', icon: Settings };

// Cosmetic only: decides which links to SHOW. Access is enforced on the server.
export function useIsAdmin() {
  const { data } = authClient.useSession();
  return data?.user?.userRole === 'admin';
}

export function isAdminPath(pathname) {
  return pathname === '/dashboard' || Boolean(pathname?.startsWith('/dashboard/'));
}

export function isActiveAdminLink(link, pathname) {
  if (!pathname) return false;
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
