'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
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

// The card is 3:4. Width is capped by the viewport height so the card + buttons
// always fit on short phones.
const CARD_WIDTH = 'min(340px, calc((100dvh - 190px) * 0.75))';
// 72px of 1080×1440 — keeps the overlays clipped to the card's rounded corners.
const CARD_RADIUS = '6.67% / 5%';

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
  backgroundImage:
    'linear-gradient(110deg, #c5dde3 0%, #c5dde3 38%, #f0f8fa 50%, #c5dde3 62%, #c5dde3 100%)',
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
  backgroundImage:
    'linear-gradient(110deg, #d3e8ec 0%, #d3e8ec 38%, #f7fcfd 50%, #d3e8ec 62%, #d3e8ec 100%)',
};

const MODAL_CSS = `
  @keyframes qr-sheen {
    0%, 62% { transform: translateX(-10%) skewX(-14deg); }
    100% { transform: translateX(600%) skewX(-14deg); }
  }
  .qr-sheen { animation: qr-sheen 5.5s ease-in-out 0.5s infinite; }

  @keyframes qr-shimmer {
    from { background-position: 100% 0; }
    to { background-position: 0 0; }
  }
  .qr-skel {
    background-size: 300% 100%;
    background-repeat: no-repeat;
    animation: qr-shimmer 1.5s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .qr-sheen { display: none; }
    .qr-skel { animation: none; }
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

// Mounted fresh every time the modal opens, so the canvas is always drawn for
// whichever product was tapped. The card paints instantly with everything the
// product already carries (name, price, discount); only the QR and the photo
// are filled in afterwards, each one dissolving its own skeleton.
function PassDialog({ product }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [attempt, setAttempt] = useState(0);
  const [saveState, setSaveState] = useState('idle'); // idle | working | done
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();

  const url = `${window.location.origin}/shop/product/${product?.slug}`;
  const complete = progress.avatar && progress.qr && progress.font;

  // pointer-driven tilt + light. Springs smooth it, nothing re-renders.
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(30);
  const x = useSpring(pointerX, { stiffness: 160, damping: 20, mass: 0.6 });
  const y = useSpring(pointerY, { stiffness: 160, damping: 20, mass: 0.6 });
  const rotateY = useTransform(x, [0, 100], [-12, 12]);
  const rotateX = useTransform(y, [0, 100], [10, -10]);
  const shine = useMotionTemplate`radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.4), rgba(255,255,255,0) 55%)`;

  // Layout effect: the first paint happens before the browser does, so there
  // is never a blank-canvas frame.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

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

    return () => pass.cancel();
  }, [url, product, attempt]);

  function handlePointerMove(event) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 100);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 100);
  }

  function resetTilt() {
    pointerX.set(50);
    pointerY.set(30);
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
      <style>{MODAL_CSS}</style>

      <div
        className="w-full"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerUp={resetTilt}
        onPointerCancel={resetTilt}
        style={{ touchAction: 'none' }}
      >
        <motion.div
          className="relative w-full"
          aria-busy={!complete && !progress.error}
          style={{
            aspectRatio: '3 / 4',
            rotateX: reduceMotion ? 0 : rotateX,
            rotateY: reduceMotion ? 0 : rotateY,
            transformPerspective: 900,
          }}
        >
          <canvas
            ref={canvasRef}
            width={PASS_W}
            height={PASS_H}
            role="img"
            aria-label={`Share card with a QR code for ${product?.name ?? 'this product'}`}
            className="absolute inset-0 h-full w-full drop-shadow-[0_30px_45px_rgba(0,0,0,0.45)]"
          />

          {/* photo skeleton: fades out the moment the photo is painted */}
          <div
            aria-hidden="true"
            className={`qr-skel pointer-events-none absolute transition-opacity duration-300 ${
              progress.avatar ? 'opacity-0' : 'opacity-100'
            }`}
            style={AVATAR_SKELETON_STYLE}
          />

          {/* QR skeleton: same finder eyes + clear centre as the real code */}
          <div
            aria-hidden="true"
            className={`qr-skel pointer-events-none absolute transition-opacity duration-300 ${
              progress.qr || progress.error ? 'opacity-0' : 'opacity-100'
            }`}
            style={QR_SKELETON_STYLE}
          />

          {progress.error && (
            <div
              className="absolute flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 px-6 text-center backdrop-blur-sm"
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

          {complete && !reduceMotion && (
            <>
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: CARD_RADIUS, background: shine, mixBlendMode: 'soft-light' }}
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
        </motion.div>
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
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-90"
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
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          key="qr-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Share card for ${product?.name ?? 'this product'}`}
          className="fixed inset-0 z-70 flex items-center justify-center p-4"
        >
          {/* backdrop: blur + dim live on the same element as its fade, so the blur fades in smoothly */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-ink/75 backdrop-blur-md"
          />

          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute left-1/2 top-1/2 h-160 w-160 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(48,136,152,0.5),transparent_65%)]"
          />

          <motion.button
            type="button"
            onClick={onClose}
            aria-label="Close"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <X size={18} />
          </motion.button>

          {/* the card drops in like it's being dealt, then settles */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 70, scale: 0.78, rotateX: 28 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{ transformPerspective: 1000 }}
          >
            <PassDialog product={product} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}