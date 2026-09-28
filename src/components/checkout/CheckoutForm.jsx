// →  src/components/checkout/CheckoutForm.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { DELIVERY_OPTIONS } from '@/lib/checkout/pricing';

function DeliveryAreaSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = DELIVERY_OPTIONS.findIndex((option) => option.value === value);
  const selectedOption = DELIVERY_OPTIONS[selectedIndex] ?? DELIVERY_OPTIONS[0];

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openMenu() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function chooseOption(option) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleOptionKeyDown(event, index) {
    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = (index + 1) % DELIVERY_OPTIONS.length;
    else if (event.key === 'ArrowUp') nextIndex = (index - 1 + DELIVERY_OPTIONS.length) % DELIVERY_OPTIONS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = DELIVERY_OPTIONS.length - 1;
    else return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <button
        ref={triggerRef}
        id="checkout-delivery-area"
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="checkout-delivery-options"
        aria-label={`Delivery area: ${selectedOption.label}, ${selectedOption.fee} taka`}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(32,36,38,0.04)] transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 ${
          open ? 'border-primary' : 'border-border'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <MapPin size={17} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-text">{selectedOption.label}</span>
            <span className="mt-0.5 block text-xs text-text-muted">Delivery fee · {selectedOption.fee}৳</span>
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="checkout-delivery-options"
            role="listbox"
            aria-label="Delivery area options"
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-2xl border border-border bg-white p-1.5 shadow-[0_16px_40px_rgba(32,36,38,0.16)]"
          >
            {DELIVERY_OPTIONS.map((option, index) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  ref={(element) => { optionRefs.current[index] = element; }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => chooseOption(option)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    selected ? 'bg-primary-soft/70' : 'hover:bg-surface'
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-text">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">Delivery fee · {option.fee}৳</span>
                  </span>
                  {selected && <Check size={17} className="shrink-0 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// This form is the same for every product in the cart — one address, one
// phone number, one delivery slot, regardless of how many jerseys are in it.
export default function CheckoutForm({ value, errors, onChange }) {
  return (
    <div className="grid gap-4 rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:grid-cols-2 sm:p-6">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Full Name
        </label>
        <div className="relative mt-1.5">
          <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Your name"
            className={`w-full rounded-2xl border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary ${
              errors.name ? 'border-danger' : 'border-border'
            }`}
          />
        </div>
        {errors.name && <p className="mt-1 text-xs font-medium text-danger">{errors.name}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Delivery Address
        </label>
        <div className="relative mt-1.5">
          <MapPin size={18} className="absolute left-3.5 top-3.5 text-text-muted" />
          <textarea
            rows={2}
            value={value.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="House, street, area, city"
            className={`w-full resize-y rounded-2xl border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary ${
              errors.address ? 'border-danger' : 'border-border'
            }`}
          />
        </div>
        {errors.address && <p className="mt-1 text-xs font-medium text-danger">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Phone Number
        </label>
        <div className="relative mt-1.5">
          <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="tel"
            maxLength={11}
            value={value.phone}
            onChange={(e) => onChange('phone', e.target.value.replace(/\D/g, ''))}
            placeholder="01XXXXXXXXX"
            className={`w-full rounded-2xl border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary ${
              errors.phone ? 'border-danger' : 'border-border'
            }`}
          />
        </div>
        {errors.phone && <p className="mt-1 text-xs font-medium text-danger">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Number 2 <span className="normal-case text-text-muted/70">(optional)</span>
        </label>
        <div className="relative mt-1.5">
          <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="tel"
            maxLength={11}
            value={value.phone2}
            onChange={(e) => onChange('phone2', e.target.value.replace(/\D/g, ''))}
            placeholder="Alternate number"
            className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Additional Note <span className="normal-case text-text-muted/70">(optional)</span>
        </label>
        <div className="relative mt-1.5">
          <MessageSquare size={18} className="absolute left-3.5 top-3.5 text-text-muted" />
          <textarea
            rows={2}
            value={value.note}
            onChange={(e) => onChange('note', e.target.value)}
            placeholder="Anything we should know about your order"
            className="w-full resize-y rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="checkout-delivery-area" className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Delivery Area
        </label>
        <DeliveryAreaSelect value={value.deliveryArea} onChange={(area) => onChange('deliveryArea', area)} />
      </div>

      {/* Locked to COD for now — the bKash slot is already here, wired up
          the moment that integration is ready. */}
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
          Payment Method
        </label>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-center rounded-2xl border-2 border-primary bg-primary-soft px-4 py-3 text-sm font-semibold text-primary-dark">
            Cash on Delivery
          </div>
          <div className="flex cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-muted/60">
            bKash — soon
          </div>
        </div>
      </div>
    </div>
  );
}