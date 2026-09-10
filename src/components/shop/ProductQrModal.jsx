'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import { X } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function ProductQrModal({ product, open, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/product/${product?.slug}`
      : `/product/${product?.slug}`;

  return createPortal(
    <div
      className={`fixed inset-0 z-70 flex items-center justify-center p-4 transition-all duration-300 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* BACKDROP: Clean solid semi-transparent fade without blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 transition-opacity duration-300"
      />

      {/* MODAL: Smooth scale and fade */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`QR code for ${product?.name}`}
        className={`relative z-10 w-full max-w-sm rounded-3xl border border-border bg-white p-8 text-center shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.207,0.473,0.504,0.935)] ${
          open ? 'scale-100 opacity-100' : 'scale-81 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <X size={16} />
        </button>

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Scan to view
        </p>

        <h3 className="mt-1 line-clamp-1 text-lg font-semibold text-text">
          {product?.name}
        </h3>

        {/* QR Viewfinder Container */}
        <div className="relative mx-auto mt-6 w-fit rounded-2xl bg-surface p-6">
          <span className="absolute left-2 top-2 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-primary" />
          <span className="absolute right-2 top-2 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-primary" />
          <span className="absolute bottom-2 left-2 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-primary" />
          <span className="absolute bottom-2 right-2 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-primary" />

          <QRCode
            value={url}
            size={168}
            bgColor="transparent"
            fgColor="#252a2c"
            level="M"
          />
        </div>

        <p className="mt-6 text-base font-semibold text-text">
          {formatPrice(product?.price)}৳
        </p>
      </div>
    </div>,
    document.body
  );
}