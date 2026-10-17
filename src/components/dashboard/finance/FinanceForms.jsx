'use client';

import { useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { addExpenses, addMoneyIn, addTransfer, saveOpeningBalances } from '@/lib/api/requests/finance';
import { formatPrice } from '@/lib/format';
import DateInput from '@/components/dashboard/DateInput';

export const ACCOUNTS = ['Cash', 'Bank', 'bKash', 'Nagad'];

const inputClass =
  'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary';

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function AccountSelect({ name, value, onChange, defaultValue, label }) {
  const controlled = value !== undefined;
  return (
    <select
      name={name}
      aria-label={label}
      className={inputClass}
      {...(controlled ? { value, onChange } : { defaultValue })}
    >
      {ACCOUNTS.map((account) => (
        <option key={account} value={account}>
          {account}
        </option>
      ))}
    </select>
  );
}

function SubmitButton({ saving, children }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

// Runs a server action, shows the result, closes the dialog on success.
function useSave(action, successMessage, onDone) {
  const [saving, setSaving] = useState(false);

  async function run(payload) {
    setSaving(true);
    try {
      const result = await action(payload);
      if (!result?.success) {
        toast.error(result?.error || 'Could not save. Please try again.');
        return;
      }
      toast.success(successMessage);
      onDone();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return [saving, run];
}

export function MoneyInForm({ today, onDone }) {
  const [saving, run] = useSave(addMoneyIn, 'Money in saved.', onDone);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      date: form.get('date'),
      account: form.get('account'),
      amount: form.get('amount'),
      note: form.get('note'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DateInput label="Date" name="date" defaultValue={today} required />
        <Field label="Deposit to">
          <AccountSelect name="account" defaultValue="Cash" />
        </Field>
      </div>
      <Field label="Amount (৳)">
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          placeholder="0"
          className={inputClass}
        />
      </Field>
      <Field label="Where did it come from?">
        <input name="note" maxLength={300} placeholder="Courier payout, advance, owner deposit" className={inputClass} />
      </Field>
      <SubmitButton saving={saving}>Save money in</SubmitButton>
    </form>
  );
}

export function ExpenseForm({ today, onDone }) {
  const nextId = useRef(1);
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState([{ id: 0, name: '', amount: '', paidFrom: 'Cash' }]);
  const [saving, run] = useSave(addExpenses, 'Expenses saved.', onDone);

  const total = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  function updateRow(id, patch) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    const id = nextId.current++;
    const paidFrom = rows[rows.length - 1]?.paidFrom ?? 'Cash';
    setRows((current) => [...current, { id, name: '', amount: '', paidFrom }]);
  }

  function removeRow(id) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  }

  function handleSubmit(event) {
    event.preventDefault();
    run({
      date,
      rows: rows.map(({ name, amount, paidFrom }) => ({ name, amount, paidFrom })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DateInput label="Date" value={date} onChange={setDate} required />

      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.id} className="space-y-2 rounded-xl border border-border p-3">
            <div className="flex items-start gap-2">
              <input
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                maxLength={200}
                placeholder="What was it for?"
                aria-label={`Expense ${index + 1} description`}
                className={inputClass}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Remove expense ${index + 1}`}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface hover:text-danger"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={row.amount}
                onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Amount (৳)"
                aria-label={`Expense ${index + 1} amount`}
                className={inputClass}
              />
              <AccountSelect
                value={row.paidFrom}
                onChange={(e) => updateRow(row.id, { paidFrom: e.target.value })}
                label={`Expense ${index + 1} paid from`}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
        >
          <Plus size={15} />
          Add another
        </button>
        <p className="text-sm text-text-muted">
          Total <span className="font-semibold tabular-nums text-text">{formatPrice(total)}৳</span>
        </p>
      </div>

      <SubmitButton saving={saving}>Save expenses</SubmitButton>
    </form>
  );
}

export function TransferForm({ today, onDone }) {
  const [saving, run] = useSave(addTransfer, 'Transfer saved.', onDone);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('from') === form.get('to')) {
      toast.error('Choose two different accounts.');
      return;
    }
    run({
      date: form.get('date'),
      from: form.get('from'),
      to: form.get('to'),
      amount: form.get('amount'),
      note: form.get('note'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DateInput label="Date" name="date" defaultValue={today} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          <AccountSelect name="from" defaultValue="Cash" />
        </Field>
        <Field label="To">
          <AccountSelect name="to" defaultValue="Bank" />
        </Field>
      </div>
      <Field label="Amount (৳)">
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          required
          placeholder="0"
          className={inputClass}
        />
      </Field>
      <Field label="Note">
        <input name="note" maxLength={300} placeholder="Why are you moving it?" className={inputClass} />
      </Field>
      <SubmitButton saving={saving}>Save transfer</SubmitButton>
    </form>
  );
}

export function OpeningForm({ opening, onDone }) {
  const [saving, run] = useSave(saveOpeningBalances, 'Opening balances saved.', onDone);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      cash: form.get('cash'),
      bank: form.get('bank'),
      bkash: form.get('bkash'),
      nagad: form.get('nagad'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-muted">
        What each account held before you started recording here. Balances are this plus every
        entry in the ledger, so set it once.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          ['cash', 'Cash'],
          ['bank', 'Bank'],
          ['bkash', 'bKash'],
          ['nagad', 'Nagad'],
        ].map(([key, label]) => (
          <Field key={key} label={`${label} (৳)`}>
            <input
              name={key}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={opening?.[key] ?? 0}
              className={inputClass}
            />
          </Field>
        ))}
      </div>
      <SubmitButton saving={saving}>Save opening balances</SubmitButton>
    </form>
  );
}
