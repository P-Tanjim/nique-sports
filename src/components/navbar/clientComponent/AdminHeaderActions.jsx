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
        className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
      >
        <Store size={18} strokeWidth={1.8} />
        <span className="hidden min-[1050px]:inline">View store</span>
      </Link>
      <AdminSignOutButton />
    </div>
  );
}
