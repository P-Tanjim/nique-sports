// →  src/components/checkout/CheckoutForm.jsx
'use client';

import { MapPin, MessageSquare, Phone, User } from 'lucide-react';
import AnimatedSelect from '@/components/dashboard/products/AnimatedSelect';
import { DELIVERY_OPTIONS } from '@/lib/checkout/pricing';

const deliverySelectOptions = DELIVERY_OPTIONS.map((option) => ({
  value: option.value,
  label: `${option.label} — ${option.fee}৳`,
}));

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
        <AnimatedSelect
          label="Delivery Area"
          options={deliverySelectOptions}
          value={value.deliveryArea}
          onChange={(v) => onChange('deliveryArea', v)}
        />
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