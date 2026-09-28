// →  src/components/checkout/ProductTabPanel.jsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Save } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import MiniModal from './MiniModal';

// Cart items don't store the full list of sizes a product is sold in, so
// this standard set is offered by default. If you later add
// `availableSizes: product.size` to the cartItem in PurchasePanel.jsx,
// this component picks it up automatically — nothing to change here.
const FALLBACK_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const normalizeOption = (option) =>
  typeof option === 'string'
    ? { image: option, price: 0 }
    : { ...option, image: option?.image ?? '', price: Number(option?.price) || 0 };

function FieldLabel({ children }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  );
}

export default function ProductTabPanel({ item, onSizeChange, onCustomizationChange, onPatchChange }) {
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [fontEditorOpen, setFontEditorOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftNumber, setDraftNumber] = useState('');
  const [draftFont, setDraftFont] = useState(null);

  const name = item.name ?? item.title;
  const image = item.image ?? item.imagesLink?.[0];
  const sizes = item.availableSizes?.length ? item.availableSizes : FALLBACK_SIZES;
  const selectedFont = normalizeOption(item.customization?.font);
  const fontImage = selectedFont.image;
  const fontOptions = (Array.isArray(item.fontsImg) ? item.fontsImg : [])
    .map(normalizeOption)
    .filter((option) => option.image);
  const selectedPatches = (Array.isArray(item.patch) ? item.patch : item.patch ? [item.patch] : [])
    .map(normalizeOption)
    .filter((option) => option.image);
  const patchOptions = (Array.isArray(item.patchsImg) ? item.patchsImg : [])
    .map(normalizeOption)
    .filter((option) => option.image);
  const allPatchOptions = [
    ...patchOptions,
    ...selectedPatches.filter((selected) => !patchOptions.some((option) => option.image === selected.image)),
  ];
  const customName = item.customization?.name;
  const customNumber = item.customization?.number;
  const hasFontCustomization = Boolean(fontOptions.length || item.customization?.font);

  function openFontEditor() {
    setDraftName(customName ?? '');
    setDraftNumber(customNumber ?? '');
    setDraftFont(selectedFont.image ? selectedFont : null);
    setFontEditorOpen(true);
  }

  function togglePatch(patch) {
    const selected = selectedPatches.some((option) => option.image === patch.image);
    const nextPatches = selected
      ? selectedPatches.filter((option) => option.image !== patch.image)
      : [...selectedPatches, patch];
    onPatchChange?.(nextPatches);
  }

  function saveFontCustomization() {
    onCustomizationChange?.({
      ...item.customization,
      fontEnabled: true,
      name: draftName.trim().toUpperCase(),
      number: draftNumber,
      font: draftFont,
    });
    setFontEditorOpen(false);
  }

  return (
    <div className="flex gap-4 rounded-3xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:gap-5 sm:p-5">
      {/* LEFT — product image */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface sm:h-40 sm:w-40">
        {image ? (
          <Image
            src={image}
            alt={name || 'Product image'}
            fill
            sizes="(max-width: 640px) 112px, 160px"
            unoptimized={image.startsWith('data:')}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
            No image
          </div>
        )}
      </div>

      {/* RIGHT — details column */}
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text sm:text-base">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Qty {item.quantity} · {formatPrice(item.price)}৳ each
          </p>
        </div>

        {/* SIZE — changeable right here */}
        <div>
          <FieldLabel>Size</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((size) => {
              const active = size === item.size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeChange(size)}
                  aria-pressed={active}
                  className={`flex h-8 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors active:scale-95 ${
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-text-muted hover:border-primary/40'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* PATCHES — display every selected patch */}
        {(patchOptions.length > 0 || selectedPatches.length > 0) && (
          <div>
            <FieldLabel>{selectedPatches.length > 1 ? 'Patches' : 'Patch'}</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {selectedPatches.map((patch, index) => (
                <button
                  key={`${patch.image}-${index}`}
                  type="button"
                  onClick={() => setPatchModalOpen(true)}
                  aria-label={`Edit selected patch ${index + 1}`}
                  className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition-transform active:scale-95"
                >
                  <Image src={patch.image} alt={`Selected patch ${index + 1}`} fill sizes="48px" unoptimized className="object-contain p-1" />
                </button>
              ))}
              {selectedPatches.length === 0 && (
                <button
                  type="button"
                  onClick={() => setPatchModalOpen(true)}
                  className="cursor-pointer text-xs font-medium text-primary hover:underline"
                >
                  No patches selected. Choose patches
                </button>
              )}
            </div>
          </div>
        )}

        {/* FONT — either the image or text opens the editor */}
        {hasFontCustomization && (
          <div>
            <FieldLabel>Font</FieldLabel>
            <div className="flex items-center gap-3">
              {(fontImage || image) && hasFontCustomization && (
                <button
                  type="button"
                  onClick={openFontEditor}
                  aria-label="Edit name, number, and font"
                  className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition-transform active:scale-95"
                >
                  <Image src={fontImage || image} alt="Selected font" fill sizes="48px" unoptimized className="object-contain p-1" />
                </button>
              )}
              <button
                type="button"
                onClick={openFontEditor}
                className="min-w-0 cursor-pointer text-left text-xs"
                aria-label="Edit name, number, and font"
              >
                {customName && <p className="truncate text-sm font-semibold tracking-wide text-text">{customName}</p>}
                {customNumber && <p className="text-text-muted">No. {customNumber}</p>}
                {!fontImage && <p className="font-medium text-primary">No font selected. Choose one.</p>}
                {fontImage && !customName && !customNumber && <p className="text-text-muted">No name or number</p>}
              </button>
            </div>
          </div>
        )}
      </div>

      <MiniModal open={patchModalOpen} title="Choose patches" onClose={() => setPatchModalOpen(false)} size="wide">
        <div className="space-y-4 text-left">
          <section>
            <FieldLabel>Your selected patches</FieldLabel>
            {selectedPatches.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {selectedPatches.map((patch, index) => (
                  <button
                    key={`${patch.image}-${index}`}
                    type="button"
                    onClick={() => togglePatch(patch)}
                    aria-label={`Remove selected patch ${index + 1}`}
                    className="relative aspect-square overflow-hidden rounded-lg border-2 border-primary bg-white"
                  >
                    <Image src={patch.image} alt={`Selected patch ${index + 1}`} fill sizes="80px" unoptimized className="object-contain p-1" />
                    <Check size={14} className="absolute right-1 top-1 rounded-full bg-primary text-white" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No patches selected.</p>
            )}
          </section>

          <section className="border-t border-border pt-3">
            <FieldLabel>All patches</FieldLabel>
            {allPatchOptions.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {allPatchOptions.map((patch, index) => {
                  const selected = selectedPatches.some((option) => option.image === patch.image);
                  return (
                    <button
                      key={`${patch.image}-${index}`}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      aria-label={`${selected ? 'Remove' : 'Select'} patch ${index + 1}`}
                      onClick={() => togglePatch(patch)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition-colors ${
                        selected ? 'border-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Image src={patch.image} alt={`Patch option ${index + 1}`} fill sizes="80px" unoptimized className="object-contain p-1" />
                      {selected && <Check size={14} className="absolute right-1 top-1 rounded-full bg-primary text-white" />}
                      <span className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-[10px] font-semibold text-text">
                        {formatPrice(patch.price)}৳
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No other patches are available.</p>
            )}
          </section>
        </div>
      </MiniModal>

      <MiniModal
        open={fontEditorOpen}
        title="Edit font"
        onClose={() => setFontEditorOpen(false)}
        size="admin"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-transparent">
              {draftFont?.image || image ? (
                <Image
                  src={draftFont?.image || image}
                  alt="Selected font preview"
                  fill
                  sizes="80px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-text-muted">Font preview</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <label className="block text-xs font-semibold text-text-muted">
                Name
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value.toUpperCase())}
                  maxLength={14}
                  placeholder="YOUR NAME"
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm font-medium text-text outline-none transition-colors focus:border-primary"
                />
              </label>
              <label className="block text-xs font-semibold text-text-muted">
                Number
                <input
                  value={draftNumber}
                  onChange={(event) => setDraftNumber(event.target.value.replace(/\D/g, '').slice(0, 2))}
                  inputMode="numeric"
                  placeholder="10"
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm font-medium text-text outline-none transition-colors focus:border-primary"
                />
              </label>
            </div>
          </div>

          {fontOptions.length > 0 && (
            <div className="border-t border-border pt-3">
              <FieldLabel>Font style</FieldLabel>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Font options">
                {fontOptions.map((font, index) => {
                  const selected = draftFont?.image === font.image;
                  return (
                    <button
                      key={`${font.image}-${index}`}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Choose font ${index + 1}`}
                      onClick={() => setDraftFont(font)}
                      className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-white transition-colors ${
                        selected ? 'border-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Image src={font.image} alt={`Font option ${index + 1}`} fill sizes="64px" unoptimized className="object-contain p-1" />
                      {selected && <Check size={14} className="absolute right-1 top-1 rounded-full bg-primary text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setFontEditorOpen(false)}
              className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveFontCustomization}
              disabled={!draftFont?.image}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>
      </MiniModal>
    </div>
  );
}