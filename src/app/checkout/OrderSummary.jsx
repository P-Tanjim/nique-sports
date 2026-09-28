// →  src/components/checkout/OrderSummary.jsx
import { formatPrice } from '@/lib/format';
import { getItemLineTotal } from '@/lib/checkout/pricing';

const optionPrice = (option) => (typeof option === 'string' ? 0 : Number(option?.price) || 0);

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