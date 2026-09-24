'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Generic jersey measurements (in inches) — swap these for your real spec
// sheet whenever you have it; the table just maps over this array, so
// adding/removing rows or sizes is a one-line change.
const SIZE_CHART = [
  { size: 'S', chest: '36–38', length: '27' },
  { size: 'M', chest: '39–41', length: '28' },
  { size: 'L', chest: '42–44', length: '29' },
  { size: 'XL', chest: '45–47', length: '30' },
  { size: 'XXL', chest: '48–50', length: '31' },
];

// Portal-based modal, same structure as ProductQrModal (backdrop + centered
// panel + fade/scale transition) so it feels consistent with the rest of
// the site instead of introducing a new modal pattern.
export default function SizeChartModal({ open, onClose }) {
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

  return createPortal(
    <div
      className={`fixed inset-0 z-70 flex items-center justify-center p-4 transition-all duration-300 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div onClick={onClose} className="absolute inset-0 bg-ink/50" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Size guide"
        className={`relative z-10 w-full max-w-sm rounded-3xl border border-border bg-white p-6 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.207,0.473,0.504,0.935)] ${
          open ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">Size Guide</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-text-muted">
              <th className="pb-2 font-medium">Size</th>
              <th className="pb-2 font-medium">Chest (in)</th>
              <th className="pb-2 font-medium">Length (in)</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map((row) => (
              <tr key={row.size} className="border-t border-border">
                <td className="py-2 font-semibold text-text">{row.size}</td>
                <td className="py-2 text-text-muted">{row.chest}</td>
                <td className="py-2 text-text-muted">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-4 text-xs text-text-muted">
          Measurements are approximate — for a custom fit, add your exact
          chest size in the order notes at checkout.
        </p>
      </div>
    </div>,
    document.body
  );
}