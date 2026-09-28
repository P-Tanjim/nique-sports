// →  src/components/checkout/ProductTabPanel.jsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import MiniModal from './MiniModal';

// Cart items don't store the full list of sizes a product is sold in, so
// this standard set is offered by default. If you later add
// `availableSizes: product.size` to the cartItem in PurchasePanel.jsx,
// this component picks it up automatically — nothing to change here.
const FALLBACK_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const optionImage = (option) => (typeof option === 'string' ? option : option?.image ?? '');

function FieldLabel({ children }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  );
}

export default function ProductTabPanel({ item, onSizeChange }) {
  const [preview, setPreview] = useState(null); // { title, src } | null

  const name = item.name ?? item.title;
  const image = item.image ?? item.imagesLink?.[0];
  const sizes = item.availableSizes?.length ? item.availableSizes : FALLBACK_SIZES;
  const fontImage = optionImage(item.customization?.font);
  const patchImage = optionImage(item.patch);
  const customName = item.customization?.name;
  const customNumber = item.customization?.number;

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

        {/* PATCH — tap the thumbnail for a bigger look */}
        {patchImage && (
          <div>
            <FieldLabel>Patch</FieldLabel>
            <button
              type="button"
              onClick={() => setPreview({ title: 'Patch', src: patchImage })}
              aria-label="View selected patch"
              className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition-transform active:scale-95"
            >
              <Image src={patchImage} alt="Selected patch" fill sizes="48px" unoptimized className="object-contain p-1" />
            </button>
          </div>
        )}

        {/* FONT — thumbnail + the name & number they entered */}
        {fontImage && (
          <div>
            <FieldLabel>Font</FieldLabel>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPreview({ title: 'Font style', src: fontImage })}
                aria-label="View selected font"
                className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition-transform active:scale-95"
              >
                <Image src={fontImage} alt="Selected font" fill sizes="48px" unoptimized className="object-contain p-1" />
              </button>
              <div className="min-w-0 text-xs">
                {customName && <p className="truncate text-sm font-semibold tracking-wide text-text">{customName}</p>}
                {customNumber && <p className="text-text-muted">No. {customNumber}</p>}
                {!customName && !customNumber && <p className="text-text-muted">No name or number</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <MiniModal open={Boolean(preview)} title={preview?.title} onClose={() => setPreview(null)}>
        {preview && (
          <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-2xl bg-surface">
            <Image src={preview.src} alt={preview.title} fill sizes="192px" unoptimized className="object-contain p-3" />
          </div>
        )}
      </MiniModal>
    </div>
  );
}