'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function LogoutButton({ className = "" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    try {
      await authClient.signOut();
      router.replace('/');
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 ease-out hover:bg-red-100/60 active:scale-95 disabled:opacity-50 cursor-pointer ${className}`}
    >
      <LogOut size={16} strokeWidth={1.8} />
      <span>{busy ? "Logging out..." : "Log out"}</span>
    </button>
  );
}
