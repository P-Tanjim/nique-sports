'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_LINKS, isActiveAdminLink } from '@/components/navbar/adminNav';

export default function AdminDesktopLinks() {
  const pathname = usePathname();

  return ADMIN_LINKS.map((link) => {
    const { href, label, icon: Icon } = link;
    const active = isActiveAdminLink(link, pathname);

    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          className={`inline-flex items-center gap-2 py-2 text-sm transition-colors ${
            active ? 'font-medium text-primary' : 'text-text-muted hover:text-text'
          }`}
        >
          <Icon size={17} strokeWidth={1.8} />
          {label}
        </Link>
      </li>
    );
  });
}
