'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { ADMIN_LINKS, SETTINGS_LINK, isActiveAdminLink, useIsAdmin } from '@/components/navbar/adminNav';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const activeIndex = ADMIN_LINKS.findIndex((link) => isActiveAdminLink(link, pathname));
  const safeIndex = activeIndex !== -1 ? activeIndex : 0;
  const onSettings = isActiveAdminLink(SETTINGS_LINK, pathname);

  return (
    <>
      <nav
        aria-label="Admin"
        className="mobile-nav relative w-[85%] max-w-md overflow-hidden rounded-full border border-white/20 bg-primary/80 p-1.5 shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,0.9),inset_0_-8px_8px_-8px_rgba(255,255,255,0.9)] backdrop-blur-sm"
      >
        <ul className="relative flex flex-row items-center justify-between">
          <div
            aria-hidden="true"
            className={`absolute bottom-0 top-0 z-10 my-auto h-[calc(100%-2px)] rounded-3xl bg-accent shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${onSettings ? 'opacity-0' : ''}`}
            style={{
              width: `${100 / ADMIN_LINKS.length}%`,
              transform: `translateX(${safeIndex * 100}%)`,
              willChange: 'transform',
            }}
          />

          {ADMIN_LINKS.map((link, index) => {
            const { href, label, icon: Icon } = link;
            const active = !onSettings && safeIndex === index;

            return (
              <li key={href} className="relative z-20 flex-1">
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex items-center justify-center py-2.5 transition-transform active:scale-90"
                >
                  <Icon
                    size={26}
                    className={`text-white transition-all duration-300 ease-out ${
                      active ? 'scale-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* The round button beside the pill is now the Settings link (admin only) */}
      {isAdmin && (
        <Link
          href={SETTINGS_LINK.href}
          aria-label="Settings"
          className={`relative flex h-11.5 w-11.5 items-center justify-center rounded-full shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.3),inset_0_-8px_8px_-8px_rgba(0,0,0,0.3)] backdrop-blur-sm md:h-10 md:w-10 ${
            onSettings ? 'text-primary' : 'text-primary-light'
          }`}
        >
          <Settings size={20} />
        </Link>
      )}
    </>
  );
}
