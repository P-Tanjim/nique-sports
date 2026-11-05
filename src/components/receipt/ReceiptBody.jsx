import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import { formatOrderDate } from '@/lib/admin/dates';
import { dancingScript } from '@/app/fonts';

export function ReceiptBody({ receipt, forPdf = false }) {
  if (!receipt) return null;

  const statusNote =
    receipt.status === 'Cancelled'
      ? 'This order was cancelled.'
      : receipt.status === 'Returned'
        ? 'This order was returned.'
        : null;

  return (
    <div
      className="relative w-full overflow-hidden font-mono min-w-0"
      style={{
        color: '#202020',
        backgroundColor: '#ffffff',
        padding: forPdf ? '0' : '0 2px',
      }}
    >
      {/* WATERMARK: 4 rows rotated -24deg in teal rgba at ~8% opacity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden flex flex-col justify-around items-center"
        style={{ zIndex: 0 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              transform: 'rotate(-24deg)',
              color: 'rgba(48, 136, 152, 0.08)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '3px',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            NIQUE SPORTS &nbsp; NIQUE SPORTS &nbsp; NIQUE SPORTS
          </div>
        ))}
      </div>

      {/* RECEIPT CONTENT */}
      <div className="relative min-w-0" style={{ zIndex: 1 }}>
        {/* 1. Header with Logo & Shop Name */}
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            width={24}
            height={24}
            loading="eager"
            alt="NIQUE SPORTS"
            className="mb-1"
          />
          <span
            className={dancingScript.className}
            style={{
              color: '#308898',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: '1.2',
            }}
          >
            NIQUE SPORTS
          </span>
          <span
            style={{
              color: '#555555',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginTop: '2px',
            }}
          >
            Order receipt
          </span>
        </div>

        {/* 2. Order Metadata */}
        <div style={{ borderTop: '1px dashed #202020', margin: '10px 0', width: '100%' }} />
        <div className="space-y-1 tabular-nums" style={{ fontSize: '11px', color: '#202020' }}>
          <div className="flex items-center justify-between">
            <span style={{ color: '#555555' }}>Order no</span>
            <span className="font-medium">{receipt.orderNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: '#555555' }}>Date</span>
            <span>{formatOrderDate(receipt.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: '#555555' }}>Status</span>
            <span className="font-medium">{receipt.status}</span>
          </div>
          {statusNote && (
            <div style={{ fontSize: '10px', color: '#202020', marginTop: '2px' }}>
              {statusNote}
            </div>
          )}
        </div>

        {/* 3. Items list */}
        <div style={{ borderTop: '1px dashed #202020', margin: '10px 0', width: '100%' }} />
        <div className="min-w-0">
          {(receipt.items || []).map((item, idx) => {
            const customParts = [];
            if (item.custName && item.custNumber) {
              customParts.push(`Name: ${item.custName}  No: ${item.custNumber}`);
            } else if (item.custName) {
              customParts.push(`Name: ${item.custName}`);
            } else if (item.custNumber) {
              customParts.push(`No: ${item.custNumber}`);
            }
            if (item.hasFont) {
              customParts.push('Custom font');
            }
            if (item.patchCount > 0) {
              customParts.push(`${item.patchCount} ${item.patchCount === 1 ? 'patch' : 'patches'}`);
            }

            return (
              <div key={idx} className="mb-2 last:mb-0 min-w-0">
                <div
                  className="break-words font-medium leading-snug"
                  style={{ color: '#202020', fontSize: '11px' }}
                >
                  {item.title}
                </div>
                {customParts.length > 0 && (
                  <div
                    className="break-words leading-tight"
                    style={{ color: '#555555', fontSize: '10px', marginTop: '1px' }}
                  >
                    {customParts.join(' · ')}
                  </div>
                )}
                <div
                  className="flex items-baseline justify-between gap-2 tabular-nums leading-snug"
                  style={{ color: '#202020', fontSize: '11px', marginTop: '2px' }}
                >
                  <span className="truncate min-w-0">
                    {item.size ? `${item.size} · ` : ''}
                    {item.quantity} × {item.unitPrice !== null ? `${formatPrice(item.unitPrice)} ৳` : '—'}
                  </span>
                  <span className="shrink-0 font-medium">
                    {item.lineTotal !== null ? `${formatPrice(item.lineTotal)} ৳` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Subtotal & Totals */}
        <div style={{ borderTop: '1px dashed #202020', margin: '10px 0', width: '100%' }} />
        <div className="space-y-1 tabular-nums" style={{ fontSize: '11px', color: '#202020' }}>
          {receipt.subtotal > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: '#555555' }}>Subtotal</span>
              <span>{formatPrice(receipt.subtotal)} ৳</span>
            </div>
          )}
          {receipt.deliveryFee > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: '#555555' }}>
                Delivery{receipt.deliveryLabel ? ` (${receipt.deliveryLabel})` : ''}
              </span>
              <span>{formatPrice(receipt.deliveryFee)} ৳</span>
            </div>
          )}
          <div
            className="flex items-center justify-between font-bold"
            style={{ fontSize: '13px', color: '#202020', paddingTop: '2px' }}
          >
            <span>Total</span>
            <span>{formatPrice(receipt.total)} ৳</span>
          </div>
        </div>

        {/* 5. Payment details */}
        <div style={{ borderTop: '1px dashed #202020', margin: '10px 0', width: '100%' }} />
        <div className="space-y-1 tabular-nums" style={{ fontSize: '11px', color: '#202020' }}>
          <div className="flex items-center justify-between">
            <span style={{ color: '#555555' }}>Payment</span>
            <span>Cash on delivery</span>
          </div>
          {receipt.advance > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: '#555555' }}>Advance received</span>
              <span>{formatPrice(receipt.advance)} ৳</span>
            </div>
          )}
          <div className="flex items-center justify-between" style={{ paddingTop: '2px' }}>
            {receipt.cod === 0 ? (
              <span className="font-bold">Paid in advance</span>
            ) : (
              <>
                <span style={{ color: '#555555' }}>To pay on delivery</span>
                <span className="font-bold">{formatPrice(receipt.cod)} ৳</span>
              </>
            )}
          </div>
        </div>

        {/* 6. Footer */}
        <div style={{ borderTop: '1px dashed #202020', margin: '10px 0', width: '100%' }} />
        <div className="text-center" style={{ marginTop: '4px' }}>
          <div
            className={dancingScript.className}
            style={{ color: '#308898', fontSize: '17px', fontWeight: 600 }}
          >
            {receipt.firstName ? `Thanks for ordering, ${receipt.firstName}!` : 'Thanks for ordering!'}
          </div>
          <div style={{ color: '#555555', fontSize: '10px', marginTop: '4px', lineHeight: '1.4' }}>
            <div>We&apos;ll call you to confirm delivery.</div>
            <div>niquesports2@gmail.com</div>
            <div style={{ fontSize: '9px', color: '#777777', marginTop: '4px' }}>
              Order receipt only, not a payment confirmation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

