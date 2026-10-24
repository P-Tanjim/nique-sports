'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DateInput from '@/components/dashboard/DateInput';
import AnimatedSelect from '@/components/dashboard/products/AnimatedSelect';
import { payModerator } from '@/lib/api/requests/finance';
import { ACCOUNTS } from '@/lib/orders/constants';
import { formatPrice } from '@/lib/format';

const inputClass = 'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary';

// moderators = bills: [{ id, name, earned, paid, remaining }]
export default function ModeratorPayForm({ moderators, today, onDone }) {
  const owed = moderators.filter((m) => m.remaining > 0);
  const [date, setDate] = useState(today);
  const [modId, setModId] = useState(owed[0]?.id ?? '');
  const [amount, setAmount] = useState(owed[0] ? String(owed[0].remaining) : '');
  const [account, setAccount] = useState('bKash');
  const [saving, setSaving] = useState(false);

  if (!owed.length) return <p className="text-sm text-text-muted">No moderator has a due right now.</p>;

  const current = owed.find((m) => m.id === modId);

  function pick(id) {
    setModId(id);
    const m = owed.find((x) => x.id === id);
    if (m) setAmount(String(m.remaining)); // default = clear the full due
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await payModerator({ moderatorId: modId, amount, account, date });
      if (!res?.success) { toast.error(res?.error || 'Could not save.'); return; }
      toast.success('Payment saved.');
      onDone();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DateInput label="Date" value={date} onChange={setDate} required />
      <div>
        <span className="mb-1.5 block text-xs text-text-muted">Moderator</span>
        <AnimatedSelect
          id="pay-mod"
          value={modId}
          onChange={pick}
          triggerLabel="Moderator"
          className="w-full"
          triggerClassName={`${inputClass} flex items-center justify-between text-left`}
          options={owed.map((m) => ({ value: m.id, label: `${m.name} · due ${formatPrice(m.remaining)}৳` }))}
        />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs text-text-muted">Amount (৳){current ? `, max ${formatPrice(current.remaining)}` : ''}</span>
        <input type="number" min="0" step="0.01" max={current?.remaining} required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
      </label>
      <div>
        <span className="mb-1.5 block text-xs text-text-muted">Paid from</span>
        <AnimatedSelect
          id="pay-account"
          value={account}
          onChange={setAccount}
          triggerLabel="Paid from"
          className="w-full"
          triggerClassName={`${inputClass} flex items-center justify-between text-left`}
          options={ACCOUNTS.map((a) => ({ value: a, label: a }))}
        />
      </div>
      <button type="submit" disabled={saving} className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
        {saving && <Loader2 size={16} className="animate-spin" />}
        Pay moderator
      </button>
    </form>
  );
}
