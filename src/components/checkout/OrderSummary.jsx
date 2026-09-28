// →  src/components/checkout/OrderSummary.jsx
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { getItemLineTotal } from '@/lib/checkout/pricing';

const optionPrice = (option) => {
  if (Array.isArray(option)) return option.reduce((total, entry) => total + optionPrice(entry), 0);
  return typeof option === 'string' ? 0 : Number(option?.price) || 0;
};

// Pure presentation, no state or effects — the same markup is used in the
// desktop side column and inside the mobile bottom sheet.
export default function OrderSummary({ items, deliveryLabel, deliveryFee, subtotal, total }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, index) => {
          const name = item.name ?? item.title;
          const fontPrice = optionPrice(item.customization?.font);
          const patchPrice = optionPrice(item.patch);
          const selectedPatches = (Array.isArray(item.patch) ? item.patch : item.patch ? [item.patch] : [])
            .map((patch) => typeof patch === 'string' ? { image: patch } : patch)
            .filter((patch) => patch?.image);
          const hasPatchOptions = Array.isArray(item.patchsImg) && item.patchsImg.length > 0;

          return (
            <div key={index} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{name}</p>
                <p className="text-xs text-text-muted">
                  Qty {item.quantity}
                  {item.size ? ` · Size ${item.size}` : ''}
                </p>
                {(fontPrice > 0 || patchPrice > 0) && (
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {fontPrice > 0 && <span>+ Font {formatPrice(fontPrice)}৳ </span>}
                    {patchPrice > 0 && <span>+ Patch {formatPrice(patchPrice)}৳</span>}
                  </p>
                )}
                {(selectedPatches.length > 0 || hasPatchOptions) && (
                  <div className="mt-1 flex items-center gap-1.5">
                    {selectedPatches.map((patch, patchIndex) => (
                      <span key={`${patch.image}-${patchIndex}`} className="relative h-6 w-6 overflow-hidden rounded border border-border bg-white">
                        <Image src={patch.image} alt="Selected patch" fill sizes="24px" unoptimized className="object-contain p-0.5" />
                      </span>
                    ))}
                    <span className="text-[11px] text-text-muted">
                      {selectedPatches.length > 0
                        ? `${selectedPatches.length} patch${selectedPatches.length === 1 ? '' : 'es'} selected`
                        : 'No patch selected'}
                    </span>
                  </div>
                )}
              </div>
              <span className="shrink-0 font-semibold text-text">
                {formatPrice(getItemLineTotal(item))}৳
              </span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}৳</span>
        </div>
        <div className="flex justify-between text-text-muted">
          <span>Delivery{deliveryLabel ? ` (${deliveryLabel})` : ''}</span>
          <span>{formatPrice(deliveryFee)}৳</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2.5 text-base font-semibold text-text">
          <span>Total</span>
          <span>{formatPrice(total)}৳</span>
        </div>
      </div>
    </div>
  );
}