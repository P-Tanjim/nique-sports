'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_LINKS, isActiveAdminLink } from '@/components/navbar/adminNav';

// Mobile bottom bar for the admin area: flat, white, icon over label.
export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="w-full max-w-md rounded-2xl border border-border bg-white/95 p-1 backdrop-blur"
    >
      <ul className="grid grid-cols-4">
        {ADMIN_LINKS.map((link) => {
          const { href, label, icon: Icon } = link;
          const active = isActiveAdminLink(link, pathname);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  active ? 'bg-surface text-primary' : 'text-text-muted'
                }`}
              >
                <Icon size={20} strokeWidth={1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
