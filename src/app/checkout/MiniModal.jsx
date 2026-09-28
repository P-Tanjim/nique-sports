// →  src/components/checkout/MiniModal.jsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Small centered modal for things that don't fit inline (a bigger look at a
// patch/font thumbnail, etc.) — styled like an iOS action sheet, same
// language as the "featured limit" dialog in ProductForm.jsx.
export default function MiniModal({ open, title, onClose, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-9998 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-70 overflow-hidden rounded-[26px] bg-white/95 text-center shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <span className="text-sm font-semibold text-text">{title}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
              >
                <X size={15} />
              </button>
            </div>
            <div className="px-5 pb-5 pt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}