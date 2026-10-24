'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { Shirt, Trash2, X } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const MODAL_KEYFRAMES = `
  @keyframes product-modal-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes product-modal-pop {
    from { opacity: 0; transform: translateY(16px) scale(0.94); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const box = 'rounded-2xl border border-border bg-white p-4';
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-text-muted';

export default function SelectedProductModal({ item, onClose, onRemove }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [item, onClose]);

  if (!item) return null;

  const fontPrice = item.font ? Number(item.font.price) || 0 : 0;
  const patchesPrice = Array.isArray(item.patches)
    ? item.patches.reduce((sum, p) => sum + (Number(p?.price) || 0), 0)
    : 0;
  const unitPrice = (Number(item.basePrice) || 0) + fontPrice + patchesPrice;
  const quantity = Number(item.quantity) || 1;
  const total = unitPrice * quantity;

  return (
    <>
      <style>{MODAL_KEYFRAMES}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-70 flex items-center justify-center bg-ink/55 p-3 backdrop-blur-[2px] sm:p-6 animate-[product-modal-fade_0.2s_ease-out]"
      >
        <div className="relative flex flex-col w-full max-w-lg max-h-[80vh] sm:max-h-[84vh] rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden my-auto animate-[product-modal-pop_0.22s_cubic-bezier(0.32,0.72,0,1)]">
          {/* Header (fixed at top of modal) */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft/30 text-primary-dark">
                <Shirt size={16} />
              </span>
              <h2 id="product-details-title" className="text-base font-semibold text-text">
                Product details
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white hover:text-text active:scale-95"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content (middle) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Product Card */}
            <div className={`flex gap-4 ${box}`}>
              {item.image ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface">
                  <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-text">{item.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-primary-soft/30 px-2 py-0.5 font-semibold text-primary-dark">
                    Size: {item.size || 'Standard'}
                  </span>
                  <span className="text-text-muted">
                    Qty: <strong className="text-text">{quantity}</strong>
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-text">
                  {formatPrice(item.basePrice || unitPrice)}৳
                </p>
              </div>
            </div>

            {/* Customizations Section */}
            {(item.font || item.customization?.name || item.customization?.number || (item.patches && item.patches.length > 0)) && (
              <div className={`space-y-3 ${box}`}>
                <p className={labelClass}>Customization details</p>

                {/* Font, Name & Number */}
                {(item.font || item.customization?.name || item.customization?.number) && (
                  <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface/60 p-3">
                    {item.font?.image && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                        <Image src={item.font.image} alt="Font style" fill sizes="48px" className="object-contain p-1" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold text-text">Name & Number</p>
                      <p className="mt-0.5 font-medium text-text-muted">
                        Name: <span className="font-semibold text-text">{item.customization?.name || '—'}</span>
                        {' · '}
                        No: <span className="font-semibold text-text">{item.customization?.number || '—'}</span>
                      </p>
                      {fontPrice > 0 && (
                        <p className="mt-1 font-medium text-primary">+{formatPrice(fontPrice)}৳</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Patches */}
                {Array.isArray(item.patches) && item.patches.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-text">
                        Selected patches ({item.patches.length})
                      </p>
                      {patchesPrice > 0 && (
                        <span className="text-xs font-medium text-primary">+{formatPrice(patchesPrice)}৳</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.patches.map((p, idx) => {
                        const src = typeof p === 'string' ? p : p?.image;
                        return (
                          <div
                            key={idx}
                            className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-white p-1"
                          >
                            {src ? (
                              <Image src={src} alt="Patch" fill sizes="48px" className="rounded-lg object-cover" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Summary */}
            <div className={`space-y-2 text-sm ${box}`}>
              <p className={labelClass}>Price calculation</p>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Base item price</span>
                <span>{formatPrice(item.basePrice || unitPrice)}৳</span>
              </div>
              {fontPrice > 0 && (
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Custom name & number font</span>
                  <span>+{formatPrice(fontPrice)}৳</span>
                </div>
              )}
              {patchesPrice > 0 && (
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Patches ({item.patches.length})</span>
                  <span>+{formatPrice(patchesPrice)}৳</span>
                </div>
              )}
              {quantity > 1 && (
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Quantity multiplier</span>
                  <span>×{quantity}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-text">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}৳</span>
              </div>
            </div>
          </div>

          {/* Footer Actions (fixed at bottom of modal) */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/80 bg-surface px-5 py-3.5 sm:px-6">
            {onRemove && (
              <button
                type="button"
                onClick={() => {
                  onRemove(item);
                  onClose();
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-danger transition-all hover:bg-red-100 active:scale-95"
              >
                <Trash2 size={14} />
                Remove item
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto cursor-pointer rounded-2xl bg-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-95"
            >
              <span className='mb-1'>Close</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
