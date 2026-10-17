'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteTransaction } from '@/lib/api/requests/finance';

export default function DeleteTransactionButton({ id }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm('Delete this entry? Balances will be recalculated without it.')) return;

    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (!result?.success) {
        toast.error(result?.error || 'Could not delete this entry.');
        return;
      }
      toast.success('Entry deleted.');
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Delete entry"
      title="Delete entry"
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-danger disabled:opacity-60"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} strokeWidth={1.7} />}
    </button>
  );
}
