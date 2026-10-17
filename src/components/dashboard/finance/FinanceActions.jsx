'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Settings2, X } from 'lucide-react';
import { ExpenseForm, MoneyInForm, OpeningForm, TransferForm } from './FinanceForms';

const ACTIONS = [
  { mode: 'money_in', label: 'Money in', icon: ArrowDownLeft },
  { mode: 'expense', label: 'Expense', icon: ArrowUpRight },
  { mode: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

const buttonClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-text transition-colors hover:bg-surface';

function Dialog({ title, onClose, children }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-ink/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-white sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function FinanceActions({ today, opening }) {
  const [mode, setMode] = useState(null);
  const close = useCallback(() => setMode(null), []);

  const isEntry = ACTIONS.some((action) => action.mode === mode);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {ACTIONS.map(({ mode: value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => setMode(value)} className={buttonClass}>
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMode('opening')}
          aria-label="Opening balances"
          title="Opening balances"
          className="flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <Settings2 size={16} strokeWidth={1.8} />
        </button>
      </div>

      {mode && (
        <Dialog title={mode === 'opening' ? 'Opening balances' : 'Add an entry'} onClose={close}>
          {isEntry && (
            <div role="tablist" aria-label="Entry type" className="mb-5 grid grid-cols-3 rounded-xl border border-border p-0.5 text-sm">
              {ACTIONS.map(({ mode: value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`cursor-pointer rounded-[10px] py-2 font-medium transition-colors ${
                    mode === value ? 'bg-ink text-white' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === 'money_in' && <MoneyInForm today={today} onDone={close} />}
          {mode === 'expense' && <ExpenseForm today={today} onDone={close} />}
          {mode === 'transfer' && <TransferForm today={today} onDone={close} />}
          {mode === 'opening' && <OpeningForm opening={opening} onDone={close} />}
        </Dialog>
      )}
    </>
  );
}
