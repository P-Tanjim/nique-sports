'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

// variant="icon" for the top bar, variant="row" for the side menu.
export default function AdminSignOutButton({ variant = 'icon', onDone }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    try {
      await authClient.signOut();
      onDone?.();
      router.replace('/');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={busy}
        className="flex w-full cursor-pointer items-center gap-4 border-b border-black/30 py-4 text-left text-black disabled:opacity-60"
      >
        <LogOut size={22} strokeWidth={1.5} />
        <span className="text-2xl font-light">Sign out</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      aria-label="Sign out"
      title="Sign out"
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-60"
    >
      <LogOut size={18} strokeWidth={1.8} />
    </button>
  );
}
