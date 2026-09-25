'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import IOSSwitch from '@/components/dashboard/products/IOSSwitch';
import { formatPrice } from '@/lib/format';

const IOS_EASE = [0.32, 0.72, 0, 1];

export default function CustomizationOptions({ font = false, fontImages = [], patches = [], onChange }) {
  const [fontEnabled, setFontEnabled] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [selectedFont, setSelectedFont] = useState(null);
  const [selectedPatch, setSelectedPatch] = useState('');

  function update(next) {
    onChange?.({
      fontEnabled,
      name,
      number,
      font: selectedFont,
      patch: selectedPatch,
      ...next,
    });
  }

  function toggleFont(value) {
    setFontEnabled(value);
    if (!value) setSelectedFont(null);
    update({ fontEnabled: value, font: value ? selectedFont : null });
  }

  function changeName(value) {
    setName(value);
    update({ name: value });
  }

  function changeNumber(value) {
    setNumber(value);
    update({ number: value });
  }

  function chooseFont(value) {
    const nextValue = selectedFont?.image === value?.image ? null : value;
    const nextEnabled = Boolean(nextValue);
    setSelectedFont(nextValue);
    setFontEnabled(nextEnabled);
    update({ font: nextValue, fontEnabled: nextEnabled });
  }

  function choosePatch(value) {
    const nextValue = selectedPatch?.image === value?.image ? null : value;
    setSelectedPatch(nextValue);
    update({ patch: nextValue });
  }

  if (!font && !patches.length) return null;

  return (
    <div className="mt-6 space-y-4 rounded-3xl border border-border bg-white p-4 shadow-[0_8px_24px_-18px_rgba(32,36,38,0.35)] sm:p-5">
      {font && (
        <div>
          {fontImages.length > 0 && (
            <div className="mb-4 rounded-2xl border border-border bg-surface/70 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">Font references</p>
                  <p className="mt-0.5 text-xs text-text-muted">Choose a style for your name and number.</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                  Preview
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Font styles">
                {fontImages.map((entry, index) => {
                  const option = typeof entry === 'string' ? { image: entry, price: 0 } : entry;
                  const src = option.image;
                  const selected = selectedFont?.image === src;
                  return (
                    <div key={src + index} className="min-w-0">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`Choose font reference ${index + 1}`}
                        onClick={() => chooseFont(option)}
                        className={`group relative block w-full aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-colors ${
                          selected
                            ? 'border-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Image
                          src={src}
                          alt={`Font reference ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 120px"
                          className={`object-contain p-2 transition-transform ${selected ? 'scale-[0.9]' : 'group-hover:scale-[0.96]'}`}
                        />
                        <span className={`absolute right-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-white transition-colors ${selected ? 'bg-primary' : 'bg-black/10'}`} />
                      </button>
                      <p className="mt-1 text-center text-xs font-semibold text-text">
                        {formatPrice(Number(option.price) || 0)}৳
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <IOSSwitch
            label="Add name and number"
            description="Personalize the back of your jersey"
            checked={fontEnabled}
            onChange={toggleFont}
          />

          <AnimatePresence initial={false}>
            {fontEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: IOS_EASE }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 pt-4 sm:grid-cols-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Name
                    <input
                      value={name}
                      onChange={(event) => changeName(event.target.value.toUpperCase())}
                      placeholder="YOUR NAME"
                      maxLength={14}
                      className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold tracking-wide text-text outline-none transition-colors focus:border-primary"
                    />
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Number
                    <input
                      value={number}
                      onChange={(event) => changeNumber(event.target.value.replace(/\D/g, '').slice(0, 2))}
                      inputMode="numeric"
                      placeholder="10"
                      className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold tracking-wide text-text outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {patches.length > 0 && (
        <div className={font ? 'border-t border-border pt-4' : ''}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-text">Choose a patch</span>
            <span className="text-xs text-text-muted">Optional</span>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {patches.map((entry, index) => {
              const option = typeof entry === 'string' ? { image: entry, price: 0 } : entry;
              const src = option.image;
              const selected = selectedPatch?.image === src;
              return (
                <div key={src + index} className="min-w-0">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => choosePatch(option)}
                    className={`relative block w-full bg-primary-light aspect-square cursor-pointer overflow-hidden rounded-2xl p-1.5 transition-all duration-300 ${
                    selected
                      ? ' '
                      : 'border-border hover:border-primary/50'
                  }`}
                  >
                    <Image src={src} alt={`Patch option ${index + 1}`} fill sizes="80px" className={`rounded-2xl object-cover transition-all ${selected ? 'scale-[0.89]' : 'scale-100'}`} />
                    <span className={`absolute right-1.5 top-1.5 h-4 w-4 rounded-full border-2 border-white transition-colors ${selected ? 'bg-primary' : 'bg-black/10'}`} />
                  </button>
                  <p className="mt-1 text-center text-xs font-semibold text-text">
                    {formatPrice(Number(option.price) || 0)}৳
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
