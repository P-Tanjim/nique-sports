'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Loader2, RefreshCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { dancingScript } from '@/app/fonts';
import {
  PASS_H,
  PASS_LAYOUT,
  PASS_W,
  buildQrSkeletonSvg,
  prewarmProductPass,
  startProductPass,
} from './qrPassCanvas';

const LOGO_SRC = '/logo.jpg';
const LEAVE_MS = 300;

// The card is 3:4. Width is capped by the viewport height so the card + buttons
// always fit on short phones.
const CARD_WIDTH = 'min(340px, calc((100dvh - 190px) * 0.75))';
// 72px of 1080×1440 — keeps the overlays clipped to the card's rounded corners.
const CARD_RADIUS = '6.67% / 5%';

// Same function list in both states, so the browser can interpolate them.
const ENTER_FROM = 'perspective(1000px) translate3d(0, 56px, 0) scale(0.84) rotateX(22deg)';
const ENTER_TO = 'perspective(1000px) translate3d(0, 0, 0) scale(1) rotateX(0deg)';
const TILT_REST = 'perspective(900px) rotateX(0deg) rotateY(0deg)';

/* ---- loading skeletons: sized from the painter's own layout numbers, so they
        always sit exactly where the real QR / photo will land ---- */
const pctX = (v) => `${(v / PASS_W) * 100}%`;
const pctY = (v) => `${(v / PASS_H) * 100}%`;
const { qr: QR, avatar: AVATAR } = PASS_LAYOUT;

const QR_MASK = `url("data:image/svg+xml,${encodeURIComponent(buildQrSkeletonSvg())}")`;

const QR_SKELETON_STYLE = {
  left: pctX(QR.x),
  top: pctY(QR.y),
  width: pctX(QR.size),
  height: pctY(QR.size),
  backgroundColor: '#c5dde3',
  WebkitMaskImage: QR_MASK,
  maskImage: QR_MASK,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
};

const AVATAR_SKELETON_STYLE = {
  left: pctX(AVATAR.x - AVATAR.photo),
  top: pctY(AVATAR.y - AVATAR.photo),
  width: pctX(AVATAR.photo * 2),
  height: pctY(AVATAR.photo * 2),
  borderRadius: '50%',
  backgroundColor: '#d3e8ec',
};

const MODAL_CSS = `
  .qr-card-enter { transition: transform 520ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 260ms ease-out; }
  .qr-card-exit { transition: transform 260ms ease-in, opacity 220ms ease-in; }

  @keyframes qr-sheen {
    0%, 62% { transform: translateX(-10%) skewX(-14deg); }
    100% { transform: translateX(600%) skewX(-14deg); }
  }
  .qr-sheen { animation: qr-sheen 5.5s ease-in-out 0.5s infinite; }

  /* The loading shimmer is a child that slides with transform, so it keeps
     moving on the compositor even while the main thread is busy making the QR. */
  @keyframes qr-skel-sweep {
    from { transform: translateX(0); }
    to { transform: translateX(300%); }
  }
  .qr-skel-sweep {
    background: linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%);
    animation: qr-skel-sweep 1.4s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .qr-card-enter, .qr-card-exit { transition: opacity 150ms linear; }
    .qr-sheen, .qr-shine, .qr-skel-sweep { display: none; }
  }
`;

const INITIAL_PROGRESS = { avatar: false, qr: false, font: false, error: false };

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Runs `fn` two animation frames from now (the browser needs one frame to
// commit the starting state before a CSS transition can run). Returns a cancel.
function afterNextFrames(fn) {
  let second;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(fn);
  });
  return () => {
    cancelAnimationFrame(first);
    if (second) cancelAnimationFrame(second);
  };
}

function Skeleton({ done, style }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute overflow-hidden transition-opacity duration-300 ${
        done ? 'opacity-0' : 'opacity-100'
      }`}
      style={style}
    >
      <div
        className="qr-skel-sweep absolute inset-y-0 -left-1/2 w-1/2"
        style={{ animationPlayState: done ? 'paused' : 'running' }}
      />
    </div>
  );
}

// Mounted fresh every time the modal opens, so the canvas is always drawn for
// whichever product was tapped. The card paints instantly with everything the
// product already carries (name, price, discount); only the QR and the photo
// are filled in afterwards, each one dissolving its own skeleton.
function PassDialog({ product, onPainted }) {
  const canvasRef = useRef(null);
  const tiltRef = useRef(null);
  const reduceMotionRef = useRef(false);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [attempt, setAttempt] = useState(0);
  const [saveState, setSaveState] = useState('idle'); // idle | working | done
  const [copied, setCopied] = useState(false);

  const url = `${window.location.origin}/shop/product/${product?.slug}`;
  const complete = progress.avatar && progress.qr && progress.font;

  // Layout effect: the first paint happens before the browser does, and the
  // modal only starts the card's entrance once it has been told this is done.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    reduceMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const pass = startProductPass(
      canvas,
      {
        url,
        name: product?.name,
        price: product?.price,
        originalPrice: product?.originalPrice,
        discountPercent: product?.discountPercent,
        imageSrc: product?.image,
        logoSrc: LOGO_SRC,
        scriptFamily: dancingScript.style.fontFamily,
      },
      setProgress
    );
    onPainted?.();

    return () => pass.cancel();
  }, [url, product, attempt, onPainted]);

  // Pointer tilt + light, written straight to the DOM through CSS variables —
  // no React state, no animation library.
  function handlePointerMove(event) {
    const el = tiltRef.current;
    if (!el || reduceMotionRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    el.style.transitionDuration = '120ms';
    el.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 20).toFixed(2)}deg) rotateY(${((px - 0.5) * 24).toFixed(2)}deg)`;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  }

  function resetTilt() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transitionDuration = '450ms';
    el.style.transform = TILT_REST;
    el.style.setProperty('--mx', '50%');
    el.style.setProperty('--my', '30%');
  }

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !complete || saveState === 'working') return;

    setSaveState('working');
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Empty image'))), 'image/png');
      });

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${slugify(product?.name) || 'product'}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

      setSaveState('done');
      setTimeout(() => setSaveState('idle'), 1800);
    } catch (error) {
      console.error('QR card export failed:', error);
      toast.error('Could not create the image. Please try again.');
      setSaveState('idle');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy the link.');
    }
  }

  return (
    <div className="flex flex-col items-center gap-4" style={{ width: CARD_WIDTH }}>
      <div
        className="w-full"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerUp={resetTilt}
        onPointerCancel={resetTilt}
        style={{ touchAction: 'none' }}
      >
        <div
          ref={tiltRef}
          className="relative w-full"
          aria-busy={!complete && !progress.error}
          style={{
            aspectRatio: '3 / 4',
            transform: TILT_REST,
            transitionProperty: 'transform',
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            transitionDuration: '450ms',
          }}
        >
          {/* Card shadow as a plain box-shadow behind the canvas: painted once
              into the layer, instead of a drop-shadow filter that the GPU
              would have to re-run every frame of the entrance. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ borderRadius: CARD_RADIUS, boxShadow: '0 34px 50px -14px rgba(0,0,0,0.5)' }}
          />

          <canvas
            ref={canvasRef}
            width={PASS_W}
            height={PASS_H}
            role="img"
            aria-label={`Share card with a QR code for ${product?.name ?? 'this product'}`}
            className="absolute inset-0 h-full w-full"
          />

          {/* photo skeleton: fades out the moment the photo is painted */}
          <Skeleton done={progress.avatar} style={AVATAR_SKELETON_STYLE} />

          {/* QR skeleton: same finder eyes + clear centre as the real code */}
          <Skeleton done={progress.qr || progress.error} style={QR_SKELETON_STYLE} />

          {progress.error && (
            <div
              className="absolute flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 px-6 text-center"
              style={{
                left: pctX(QR.x),
                top: pctY(QR.y),
                width: pctX(QR.size),
                height: pctY(QR.size),
              }}
            >
              <p className="text-sm font-medium text-text">Couldn&apos;t generate the QR code.</p>
              <button
                type="button"
                onClick={() => {
                  setProgress(INITIAL_PROGRESS);
                  setAttempt((n) => n + 1);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <RefreshCcw size={13} />
                Try again
              </button>
            </div>
          )}

          {complete && (
            <>
              {/* light that follows the pointer; plain alpha gradient, no blend mode */}
              <div
                aria-hidden="true"
                className="qr-shine pointer-events-none absolute inset-0"
                style={{
                  borderRadius: CARD_RADIUS,
                  background:
                    'radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgba(255,255,255,0.2), rgba(255,255,255,0) 55%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ borderRadius: CARD_RADIUS }}
              >
                <div className="qr-sheen absolute inset-y-0 -left-1/3 w-1/4 bg-linear-to-r from-transparent via-white/25 to-transparent" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!complete || saveState === 'working'}
          className={`flex h-12 flex-1 cursor-pointer items-center justify-center rounded-2xl text-sm font-semibold text-white transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
            saveState === 'done'
              ? 'bg-success shadow-[0_12px_30px_-10px_rgba(36,150,106,0.8)]'
              : 'bg-linear-to-r from-primary to-primary-light shadow-[0_12px_30px_-10px_rgba(48,136,152,0.9)] enabled:hover:brightness-110'
          }`}
        >
          <span
            key={saveState}
            className="flex items-center gap-2 animate-[cart-badge-pop_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]"
          >
            {saveState === 'working' ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Preparing…
              </>
            ) : saveState === 'done' ? (
              <>
                <Check size={17} strokeWidth={2.4} />
                Downloaded
              </>
            ) : (
              <>
                <Download size={17} />
                Download image
              </>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy product link'}
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition-all duration-200 hover:bg-white/20 active:scale-90"
        >
          <span
            key={copied ? 'check' : 'copy'}
            className="flex animate-[cart-badge-pop_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]"
          >
            {copied ? <Check size={18} strokeWidth={2.4} /> : <Copy size={18} />}
          </span>
        </button>
      </div>

      <p className="text-center text-xs text-white/60">
        1080 × 1440 PNG with transparent corners, ready to drop on a video.
      </p>
    </div>
  );
}

export default function ProductQrModal({ product, open, onClose }) {
  const [mounted, setMounted] = useState(false); // portal target exists (client only)
  const [phase, setPhase] = useState('closed');
  const [settled, setSettled] = useState(false); // entrance finished → drop will-change
  const phaseRef = useRef('closed');
  const closeTimerRef = useRef(null);
  const cancelFramesRef = useRef(null);

  const go = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
    if (next !== 'in') setSettled(false);
  }, []);

  useEffect(() => setMounted(true), []);

  // Warm the slow shared pieces (QR engine, logo, script font) while the
  // browser is idle, so the first tap on any QR button is already fast.
  // Every card mounts one of these; the warm-up itself is de-duplicated.
  useEffect(() => {
    if (navigator.connection?.saveData) return undefined;

    const warm = () =>
      prewarmProductPass({ scriptFamily: dancingScript.style.fontFamily, logoSrc: LOGO_SRC });

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 1200);
    return () => clearTimeout(id);
  }, []);

  // open / close drive the phases
  useEffect(() => {
    if (open) {
      clearTimeout(closeTimerRef.current);
      if (phaseRef.current === 'closed') {
        // Jump straight to 'loading': PassDialog mounts immediately and
        // the spinner shows. handlePainted (below) drives the 'in' entrance.
        go('loading');
      } else if (phaseRef.current === 'leaving') {
        // Re-opened mid-exit: card is still painted, go straight back.
        cancelFramesRef.current = afterNextFrames(() => go('in'));
      }
      return () => cancelFramesRef.current?.();
    }

    if (phaseRef.current === 'closed') return undefined;
    cancelFramesRef.current?.();
    go('leaving');
    closeTimerRef.current = setTimeout(() => go('closed'), LEAVE_MS);
    return () => clearTimeout(closeTimerRef.current);
  }, [open, go]);

  // PassDialog's useLayoutEffect calls this immediately after the first
  // synchronous canvas draw. Two frames later we flip to 'in' so the browser
  // commits the ENTER_FROM starting state before the transition begins.
  // This is Strict-Mode-safe: useLayoutEffect re-runs idempotently.
  const handlePainted = useCallback(() => {
    if (phaseRef.current !== 'loading') return;
    cancelFramesRef.current?.();
    cancelFramesRef.current = afterNextFrames(() => {
      if (phaseRef.current === 'loading') go('in');
    });
  }, [go]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open, onClose]);

  if (!mounted || phase === 'closed') return null;

  // Show backdrop + spinner as soon as the portal is live (phase === 'loading').
  // The card itself is also mounted in 'loading' so the canvas can start
  // painting — it will call handlePainted() which fires the entrance.
  const isLoading = phase === 'loading';

  const backdropIn = phase === 'in' || phase === 'loading';
  const cardMounted = phase === 'loading' || phase === 'in' || phase === 'leaving';
  const cardIn = phase === 'in';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share card for ${product?.name ?? 'this product'}`}
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
    >
      <style>{MODAL_CSS}</style>

      {/* backdrop: blur + dim */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/75 backdrop-blur-sm transition-opacity duration-300 ${
          backdropIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Spinner — shown while the canvas is doing its first synchronous draw */}
      {isLoading && (
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div
            aria-label="Loading QR card"
            className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white"
            style={{ animation: 'spin 0.75s linear infinite' }}
          />
          <p className="text-sm font-medium text-white/70">Generating card…</p>
        </div>
      )}

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-1/2 h-160 w-160 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(48,136,152,0.5),transparent_65%)] transition-opacity duration-500 ${
          backdropIn ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={`absolute right-4 top-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-[opacity,transform,background-color] duration-300 hover:bg-white/20 ${
          backdropIn ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        <X size={18} />
      </button>

      {/* the card drops in like it's being dealt, then settles */}
      {cardMounted && (
        <div
          className={`relative z-10 ${cardIn ? 'qr-card-enter' : 'qr-card-exit'}`}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === 'transform' && phaseRef.current === 'in') {
              setSettled(true);
            }
          }}
          style={{
            transform: cardIn ? ENTER_TO : ENTER_FROM,
            transformOrigin: '50% 100%',
            opacity: cardIn ? 1 : 0,
            // only promoted to its own layer while it is actually moving
            willChange: settled ? 'auto' : 'transform, opacity',
          }}
        >
          <PassDialog product={product} onPainted={handlePainted} />
        </div>
      )}
    </div>,
    document.body
  );
}