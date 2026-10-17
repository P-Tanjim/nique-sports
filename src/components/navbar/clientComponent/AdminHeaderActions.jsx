'use client';

import Link from 'next/link';
import { Store } from 'lucide-react';
import AdminSignOutButton from './AdminSignOutButton';

// Replaces search / cart / language in the top bar while in the admin area.
export default function AdminHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <Link
        href="/"
        aria-label="View store"
        title="View store"
        className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text max-[1049px]:relative max-[1049px]:z-10 max-[1049px]:h-11 max-[1049px]:w-11 max-[1049px]:shrink-0 max-[1049px]:cursor-pointer max-[1049px]:justify-center max-[1049px]:gap-0 max-[1049px]:p-0 max-[1049px]:text-primary-light max-[1049px]:shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.2),inset_0_-8px_8px_-8px_rgba(0,0,0,0.2)] max-[1049px]:transition-all max-[1049px]:duration-300 max-[1049px]:hover:bg-transparent max-[1049px]:hover:text-primary"
      >
        <Store size={18} strokeWidth={1.8} />
        <span className="hidden min-[1050px]:inline">View store</span>
      </Link>
    </div>
  );
}
