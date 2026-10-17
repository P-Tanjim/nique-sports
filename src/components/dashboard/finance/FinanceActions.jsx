'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Settings2, X } from 'lucide-react';
import AnimatedHeight from '@/components/common/AnimatedHeight';
import { ExpenseForm, MoneyInForm, OpeningForm, TransferForm } from './FinanceForms';

const ACTIONS = [
  { mode: 'money_in', label: 'Money in', icon: ArrowDownLeft },
  { mode: 'expense', label: 'Expense', icon: ArrowUpRight },
  { mode: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

const buttonClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-text transition-colors hover:bg-surface';

const SETTLE_EASE = 'cubic-bezier(0.207,0.473,0.504,0.935)'; // same curve as your checkout sheet
const SLIDE_MS = 400;
const DISMISS_DISTANCE = 110; // px dragged down
const DISMISS_VELOCITY = 0.6; // px per ms (a flick)

export default function FinanceActions({ today, opening }) {
  const [mounted, setMounted] = useState(false); // in the DOM at all
  const [visible, setVisible] = useState(false); // slid in
  const [dragY, setDragY] = useState(null); // px, only set while dragging
  // `mode` is NOT reset on close, so the sheet keeps its content while sliding away.
  const [mode, setMode] = useState('money_in');

  const wantOpenRef = useRef(false);
  const closeTimerRef = useRef(null);
  const dragRef = useRef(null);

  function openWith(nextMode) {
    clearTimeout(closeTimerRef.current);
    wantOpenRef.current = true;
    setMode(nextMode);
    setMounted(true); // forms mount NOW, off-screen...
    // ...and the slide only starts two frames later, once that heavy work has
    // finished, so it never competes with the animation.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (wantOpenRef.current) setVisible(true);
      })
    );
  }

  const close = useCallback(() => {
    wantOpenRef.current = false;
    setVisible(false);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setMounted(false), SLIDE_MS);
  }, []);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // Scroll lock + Escape, released the moment you close.
  useEffect(() => {
    if (!visible) return undefined;
    function handleKey(event) {
      // the date calendar handles its own Escape, so don't close the sheet too
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    }
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, close]);

  function handlePointerDown(event) {
    dragRef.current = { startY: event.clientY, lastY: event.clientY, lastT: event.timeStamp, velocity: 0, offset: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    const dt = event.timeStamp - drag.lastT;
    if (dt > 0) drag.velocity = (event.clientY - drag.lastY) / dt;
    drag.lastY = event.clientY;
    drag.lastT = event.timeStamp;
    drag.offset = Math.max(0, event.clientY - drag.startY); // can't be pulled upward
    setDragY(drag.offset);
  }

  function handlePointerUp(event) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragY(null);
    const velocity = event.timeStamp - drag.lastT > 80 ? 0 : drag.velocity; // paused before letting go = no flick
    if (drag.offset > DISMISS_DISTANCE || (drag.offset > 20 && velocity > DISMISS_VELOCITY)) close();
  }

  const isEntry = mode !== 'opening';
  const title = mode === 'opening' ? 'Opening balances' : 'Add an entry';
  const isDragging = dragY !== null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {ACTIONS.map(({ mode: value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => openWith(value)} className={buttonClass}>
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => openWith('opening')}
          aria-label="Opening balances"
          title="Opening balances"
          className="flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-xl border border-border bg-white text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <Settings2 size={16} strokeWidth={1.8} />
        </button>
      </div>

      {mounted && (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            className={`fixed inset-0 z-100 bg-primary/40 backdrop-blur-sm transition-opacity duration-300 ${
              visible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{
              transform: isDragging ? `translateY(${dragY}px)` : visible ? 'translateY(0)' : 'translateY(100%)',
              transition: isDragging ? 'none' : `transform ${SLIDE_MS}ms ${SETTLE_EASE}`,
            }}
            className="fixed inset-x-0 bottom-0 z-101 mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-b-0 border-border bg-white shadow-[0_-12px_40px_rgba(32,36,38,0.18)] will-change-transform"
          >
            {/* handle + title: the only part that starts a drag, so the form still scrolls normally */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="flex shrink-0 cursor-grab touch-none select-none flex-col items-center px-5 pt-2.5 active:cursor-grabbing"
            >
              <span className="h-1 w-10 rounded-full bg-border" />
              <div className="mt-3 flex w-full items-center justify-between">
                <h2 className="text-base font-semibold text-text">{title}</h2>
                <button
                  type="button"
                  onClick={close}
                  onPointerDown={(event) => event.stopPropagation()}
                  aria-label="Close"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <AnimatedHeight>
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
                          mode === value ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                <div key={mode} className="animate-[sheet-fade-in_0.2s_ease-out]">
                  {mode === 'money_in' && <MoneyInForm today={today} onDone={close} />}
                  {mode === 'expense' && <ExpenseForm today={today} onDone={close} />}
                  {mode === 'transfer' && <TransferForm today={today} onDone={close} />}
                  {mode === 'opening' && <OpeningForm opening={opening} onDone={close} />}
                </div>
              </AnimatedHeight>
            </div>
          </div>
        </>
      )}
    </>
  );
}