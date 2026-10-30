'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

// variant="icon" for the top bar, variant="row" for the side menu.
export default function AdminSignOutButton({ onDone }) {
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

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="flex w-full cursor-pointer items-center gap-4 border-b border-black/30 py-4 text-left text-black disabled:opacity-60 pointer-events-auto"
    >
      <LogOut size={22} strokeWidth={1.5} />
      <span className="text-2xl font-light">Sign out</span>
    </button>
  );
}
