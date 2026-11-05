'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AlertCircle, Download, House, Loader2 } from 'lucide-react';
import { ReceiptPrinter } from './ReceiptPrinter';
import { ReceiptBody } from './ReceiptBody';
import { downloadReceiptPdf } from './downloadReceiptPdf';
import { getReceipt } from '@/lib/api/requests/receipt';
import { formatPrice } from '@/lib/format';

const ORDER_REGEX = /^NS-\d{6}-[A-F0-9]{6}$/;

const ERROR_DETAILS = {
  invalid: {
    title: "That doesn't look like an order number.",
    message: 'Order numbers look like NS-261018-A1B2C3. Please check the link and try again.',
  },
  not_found: {
    title: "We couldn't find that order.",
    message: "If you just placed it, give us a minute or two and try again. If it still doesn't show up, message us with your order number.",
  },
  rate_limited: {
    title: 'Too many tries in a short time.',
    message: 'Take a short break and try again in a minute.',
  },
  error: {
    title: 'Something went wrong on our side.',
    message: 'Please try again in a moment.',
  },
};

export function OrderReceipt({ orderNo }) {
  const cleanOrderNo = typeof orderNo === 'string' ? orderNo.trim().toUpperCase() : '';
  const isFormatValid = ORDER_REGEX.test(cleanOrderNo);

  const [receipt, setReceipt] = useState(null);
  const [stage, setStage] = useState('processing');
  const [errorState, setErrorState] = useState(isFormatValid ? null : 'invalid');
  const [retryKey, setRetryKey] = useState(0);
  const [retryCooldown, setRetryCooldown] = useState(0);

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showInAppNote, setShowInAppNote] = useState(false);

  // Ensure page is at top on mount so the user sees the printer clearly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (retryCooldown <= 0) return;
    const timer = setInterval(() => {
      setRetryCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryCooldown]);

  // Fetch receipt on mount or retry
  useEffect(() => {
    if (!isFormatValid) {
      return;
    }

    let cancelled = false;

    // Check if this is a freshly placed order in this browser session
    let isJustPlaced = false;
    try {
      const last = sessionStorage.getItem('nique-sports:last-order');
      if (last && String(last).trim().toUpperCase() === cleanOrderNo) {
        isJustPlaced = true;
      }
    } catch {}

    async function loadReceipt(attempt = 0) {
      if (cancelled) return;

      const startTime = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 20_000),
        );

        const res = await Promise.race([getReceipt(cleanOrderNo), timeoutPromise]);
        if (cancelled) return;

        if (res && res.success && res.data) {
          // Success: clean up sessionStorage
          try {
            sessionStorage.removeItem('nique-sports:last-order');
          } catch {}

          // Ensure "processing" stage is visible for at least 900ms to avoid flicker
          const elapsed = Date.now() - startTime;
          if (elapsed < 900) {
            await new Promise((r) => setTimeout(r, 900 - elapsed));
          }
          if (cancelled) return;

          // Ensure viewport is scrolled to top before printer animation starts
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }

          // Render real receipt data and switch to printing in the same update
          setReceipt(res.data);
          setStage('printing');

          // Transition to complete after animation duration
          const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const printingDuration = prefersReduced ? 150 : 1900;

          setTimeout(() => {
            if (!cancelled) {
              setStage('complete');
            }
          }, printingDuration);
          return;
        }

        // Handle not_found retry for just-placed orders
        if (res?.code === 'not_found' && isJustPlaced && attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;
          return loadReceipt(attempt + 1);
        }

        // Retries exhausted or regular not_found
        try {
          sessionStorage.removeItem('nique-sports:last-order');
        } catch {}

        setErrorState(res?.code || 'error');
      } catch (err) {
        if (cancelled) return;
        setErrorState('error');
      }
    }

    loadReceipt(0);

    return () => {
      cancelled = true;
    };
  }, [cleanOrderNo, isFormatValid, retryKey]);

  const handleRetry = useCallback(() => {
    if (retryCooldown > 0) return;
    const cooldownTime = errorState === 'rate_limited' ? 30 : 5;
    setRetryCooldown(cooldownTime);
    setErrorState(null);
    setReceipt(null);
    setStage('processing');
    setRetryKey((k) => k + 1);
  }, [retryCooldown, errorState]);

  const handleDownloadPdf = useCallback(async () => {
    if (isPdfGenerating || stage !== 'complete' || !cleanOrderNo) return;

    // Check user agent on click
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/FBAN|FBAV|Instagram/i.test(ua)) {
        setShowInAppNote(true);
      }
    }

    setIsPdfGenerating(true);
    try {
      await downloadReceiptPdf(cleanOrderNo);
    } catch {
      toast.error("Couldn't create the PDF. Please try again.");
    } finally {
      setIsPdfGenerating(false);
    }
  }, [isPdfGenerating, stage, cleanOrderNo]);

  // Error cards (copy look of not-found.jsx)
  if (errorState) {
    const errorInfo = ERROR_DETAILS[errorState] || ERROR_DETAILS.error;
    return (
      <div className="mx-auto flex max-w-350 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <AlertCircle size={26} strokeWidth={1.5} />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-text">{errorInfo.title}</h2>
        <p className="mt-2 max-w-sm text-sm text-text-muted">{errorInfo.message}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {errorState !== 'invalid' && (
            <button
              type="button"
              disabled={retryCooldown > 0}
              onClick={handleRetry}
              className="cursor-pointer rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {retryCooldown > 0 ? `Try again (${retryCooldown}s)` : 'Try again'}
            </button>
          )}
          <Link
            href="/shop"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = receipt?.items?.reduce((sum, it) => sum + (Number(it?.quantity) || 1), 0) ?? 0;

  return (
    <div className="flex w-full flex-col items-center">
      {/* Animated Printer */}
      <ReceiptPrinter.Root stage={stage}>
        <ReceiptPrinter.Machine>
          {/* Header */}
          <ReceiptPrinter.Header>
            <div className="flex size-7 items-center justify-center rounded-md bg-white p-1">
              <Image
                src="/logo.png"
                width={24}
                height={24}
                loading="eager"
                alt="NIQUE SPORTS"
                className="object-contain"
              />
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              <House size={13} />
              <span>Home</span>
            </Link>
          </ReceiptPrinter.Header>

          {/* Screen */}
          <ReceiptPrinter.Screen>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-grayscale-1">
                  Order {cleanOrderNo}
                </div>
                <div className="text-xs text-grayscale-8">
                  {receipt
                    ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
                    : 'Loading items…'}
                </div>
              </div>
              <div className="text-right">
                {receipt ? (
                  <div className="tabular-nums text-sm font-bold text-grayscale-1">
                    {formatPrice(receipt.total)} ৳
                  </div>
                ) : (
                  <span className="inline-block h-4 w-16 animate-pulse rounded bg-grayscale-8/20" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <ReceiptPrinter.Status>
                {stage === 'processing'
                  ? 'Processing your order'
                  : stage === 'printing'
                    ? 'Printing your receipt'
                    : 'Receipt ready'}
              </ReceiptPrinter.Status>
            </div>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        {/* Output & Paper */}
        <ReceiptPrinter.Output style={{ height: 'auto', minHeight: '32rem' }}>
          {receipt ? (
            <ReceiptPrinter.Paper>
              <ReceiptBody receipt={receipt} />
            </ReceiptPrinter.Paper>
          ) : null}
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>

      {/* Download PDF button below printer: invisible & unclickable until complete, then fades in */}
      <div
        className={`mt-6 flex w-full max-w-sm flex-col items-center transition-opacity duration-300 ${
          stage === 'complete' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          type="button"
          disabled={stage !== 'complete' || isPdfGenerating}
          onClick={handleDownloadPdf}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-95 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100"
        >
          {isPdfGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Preparing PDF…</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download receipt (PDF)</span>
            </>
          )}
        </button>
        {showInAppNote && (
          <p className="mt-2 text-center text-xs text-text-muted">
            Download not starting? Open this page in Chrome or Safari.
          </p>
        )}
      </div>

      {/* Hidden off-screen receipt for html2canvas to capture */}
      {receipt && (
        <div
          id="receipt-pdf-root"
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '380px',
            background: '#ffffff',
            padding: '28px 24px',
          }}
        >
          <ReceiptBody receipt={receipt} forPdf />
        </div>
      )}
    </div>
  );
}

