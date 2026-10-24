'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ImageWithLoader from '@/components/common/ImageWithLoader'
import { createPortal } from 'react-dom'
import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react'
import { Maximize2, Minimize2, Scan, ShoppingBasket, X } from 'lucide-react'
import { addToCart } from '@/components/sideCart/SideCart';
import AddToCartFlyClone from '@/components/shop/AddToCartFlyClone';
import AddToCartButton from '@/components/common/AddToCartButton'

const TRANSITION_MS = 300;
const ZOOM_MS = 420;
const CART_TARGET_SELECTOR = '[data-cart-fly-target]';
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

function subscribeDesktop(callback) {
  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}
function getDesktopSnapshot() {
  return window.matchMedia('(min-width: 768px)').matches;
}
function getServerSnapshot() {
  return false;
}

/* ─── Gesture tutorial (Lottie) ─── */
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((m) => m.DotLottieReact),
  { ssr: false }
);

function GestureTip({ visible }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="flex flex-col items-center justify-center transition-transform duration-300"
        style={{
          transform: visible ? 'scale(1)' : 'scale(0.9)',
        }}
      >
        <div className="w-44 h-44 min-[420px]:w-52 min-[420px]:h-52 sm:w-60 sm:h-60 flex items-center justify-center overflow-hidden drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <DotLottieReact
            src="/pinchZoom.lottie"
            autoplay
            speed={1}
            segment={[0, 100]}
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          zoom
        </p>
      </div>
    </div>
  );
}

/* ─── Scaled & Panned image ─── */
function ScaledImage({ src, alt, scale, pan, active }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: active ? 'none' : 'transform 260ms cubic-bezier(0.2, 0, 0, 1)',
        willChange: active ? 'transform' : 'auto',
      }}
    >
      <ImageWithLoader
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover pointer-events-none select-none"
        containerClassName="relative h-full w-full"
      />
    </div>
  );
}

/* ─── Main card ─── */
const ProductCard = ({ product }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [flight, setFlight] = useState(null);
  const mountedRef = useRef(false);
  const closeTimerRef = useRef(null);
  const imageRef = useRef(null);

  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getServerSnapshot);
  const imageViewRef = useRef(null);
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const touchStateRef = useRef({ mode: null });
  const mouseStateRef = useRef({ dragging: false });
  const lastTapRef = useRef(0);
  const tipTimerRef = useRef(null);

  function handleAddToCart(event) {
    event.preventDefault();
    event.stopPropagation();
    const sourceImage = imageRef.current;
    const target = document.querySelector(CART_TARGET_SELECTOR);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!sourceImage?.complete || !sourceImage.naturalWidth || !target || reduceMotion) {
      addToCart(product, 1);
      return;
    }
    setFlight({
      src: sourceImage.currentSrc || sourceImage.src,
      from: sourceImage.getBoundingClientRect(),
      to: target.getBoundingClientRect(),
    });
  }
  function handleFlightDone() { setFlight(null); addToCart(product, 1); }

  const open = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    if (mountedRef.current) { setVisible(true); return; }
    mountedRef.current = true;
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setZoomed(false);
    setScale(1);
    setPan({ x: 0, y: 0 });
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setShowTip(false);
    clearTimeout(tipTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
    }, TRANSITION_MS);
  }, []);

  function toggleZoom() {
    if (zoomed) {
      setZoomed(false);
      setScale(1);
      setPan({ x: 0, y: 0 });
      scaleRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      setShowTip(false);
      clearTimeout(tipTimerRef.current);
    } else {
      setZoomed(true);
      setScale(1);
      setPan({ x: 0, y: 0 });
      scaleRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('nqs_pinch_tip')) {
        sessionStorage.setItem('nqs_pinch_tip', '1');
        tipTimerRef.current = setTimeout(() => {
          setShowTip(true);
          tipTimerRef.current = setTimeout(() => setShowTip(false), 1900);
        }, 450);
      }
    }
  }

  useEffect(() => {
    if (!mounted) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevPadding = document.body.style.paddingRight;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.body.style.paddingRight = prevPadding;
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, close]);

  useEffect(() => () => {
    clearTimeout(closeTimerRef.current);
    clearTimeout(tipTimerRef.current);
  }, []);

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const getBounds = useCallback((s) => {
    const el = imageViewRef.current;
    if (!el) return { maxX: 0, maxY: 0 };
    const w = el.clientWidth;
    const h = el.clientHeight;
    const maxX = Math.max(0, (w * s - w) / 2);
    const maxY = Math.max(0, (h * s - h) / 2);
    return { maxX, maxY };
  }, []);

  useEffect(() => {
    const el = imageViewRef.current;
    if (!el || !zoomed) return;

    function dist(t) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    }

    function onTouchStart(e) {
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          lastTapRef.current = 0;
          if (scaleRef.current > 1.2) {
            scaleRef.current = 1;
            panRef.current = { x: 0, y: 0 };
            setScale(1);
            setPan({ x: 0, y: 0 });
          } else {
            const nextScale = 2.2;
            scaleRef.current = nextScale;
            setScale(nextScale);
          }
          return;
        }
        lastTapRef.current = now;

        if (scaleRef.current > 1.05) {
          touchStateRef.current = {
            mode: 'pan',
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            startPanX: panRef.current.x,
            startPanY: panRef.current.y,
          };
          setIsInteracting(true);
        }
      } else if (e.touches.length === 2) {
        const p1 = e.touches[0];
        const p2 = e.touches[1];
        const d = dist(e.touches);
        const midX = (p1.clientX + p2.clientX) / 2;
        const midY = (p1.clientY + p2.clientY) / 2;
        touchStateRef.current = {
          mode: 'pinch',
          startDist: d,
          startScale: scaleRef.current,
          startMidX: midX,
          startMidY: midY,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
        };
        setIsInteracting(true);
      }
    }

    function onTouchMove(e) {
      const st = touchStateRef.current;
      if (!st.mode) return;
      e.preventDefault();

      if (st.mode === 'pan' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - st.startX;
        const dy = e.touches[0].clientY - st.startY;
        const bounds = getBounds(scaleRef.current);
        const nextX = Math.min(bounds.maxX, Math.max(-bounds.maxX, st.startPanX + dx));
        const nextY = Math.min(bounds.maxY, Math.max(-bounds.maxY, st.startPanY + dy));
        panRef.current = { x: nextX, y: nextY };
        setPan({ x: nextX, y: nextY });
      } else if (st.mode === 'pinch' && e.touches.length === 2) {
        const p1 = e.touches[0];
        const p2 = e.touches[1];
        const d = dist(e.touches);
        const midX = (p1.clientX + p2.clientX) / 2;
        const midY = (p1.clientY + p2.clientY) / 2;
        const factor = d / st.startDist;
        const nextScale = Math.min(4.5, Math.max(0.85, st.startScale * factor));
        const bounds = getBounds(nextScale);
        const deltaMidX = midX - st.startMidX;
        const deltaMidY = midY - st.startMidY;
        const nextX = Math.min(bounds.maxX, Math.max(-bounds.maxX, st.startPanX + deltaMidX));
        const nextY = Math.min(bounds.maxY, Math.max(-bounds.maxY, st.startPanY + deltaMidY));
        scaleRef.current = nextScale;
        panRef.current = { x: nextX, y: nextY };
        setScale(nextScale);
        setPan({ x: nextX, y: nextY });
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length === 1 && touchStateRef.current.mode === 'pinch') {
        const t = e.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
        };
        return;
      }

      if (e.touches.length === 0) {
        touchStateRef.current = { mode: null };
        setIsInteracting(false);

        let finalScale = scaleRef.current;
        if (finalScale < 1.08) {
          finalScale = 1;
          panRef.current = { x: 0, y: 0 };
          setScale(1);
          setPan({ x: 0, y: 0 });
        } else {
          finalScale = Math.min(4, finalScale);
          const bounds = getBounds(finalScale);
          const clampedX = Math.min(bounds.maxX, Math.max(-bounds.maxX, panRef.current.x));
          const clampedY = Math.min(bounds.maxY, Math.max(-bounds.maxY, panRef.current.y));
          scaleRef.current = finalScale;
          panRef.current = { x: clampedX, y: clampedY };
          setScale(finalScale);
          setPan({ x: clampedX, y: clampedY });
        }
      }
    }

    function onWheel(e) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.003;
      let nextScale = Math.min(4, Math.max(1, scaleRef.current + zoomFactor));
      if (nextScale < 1.08) {
        nextScale = 1;
        panRef.current = { x: 0, y: 0 };
        setPan({ x: 0, y: 0 });
      } else {
        const bounds = getBounds(nextScale);
        const clampedX = Math.min(bounds.maxX, Math.max(-bounds.maxX, panRef.current.x));
        const clampedY = Math.min(bounds.maxY, Math.max(-bounds.maxY, panRef.current.y));
        panRef.current = { x: clampedX, y: clampedY };
        setPan({ x: clampedX, y: clampedY });
      }
      scaleRef.current = nextScale;
      setScale(nextScale);
    }

    function onMouseDown(e) {
      if (scaleRef.current <= 1.05 || e.button !== 0) return;
      e.preventDefault();
      mouseStateRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: panRef.current.x,
        startPanY: panRef.current.y,
      };
      setIsInteracting(true);
    }

    function onMouseMove(e) {
      const ms = mouseStateRef.current;
      if (!ms.dragging) return;
      e.preventDefault();
      const dx = e.clientX - ms.startX;
      const dy = e.clientY - ms.startY;
      const bounds = getBounds(scaleRef.current);
      const nextX = Math.min(bounds.maxX, Math.max(-bounds.maxX, ms.startPanX + dx));
      const nextY = Math.min(bounds.maxY, Math.max(-bounds.maxY, ms.startPanY + dy));
      panRef.current = { x: nextX, y: nextY };
      setPan({ x: nextX, y: nextY });
    }

    function onMouseUp() {
      if (!mouseStateRef.current.dragging) return;
      mouseStateRef.current = { dragging: false };
      setIsInteracting(false);
    }

    function onDblClick(e) {
      e.preventDefault();
      if (scaleRef.current > 1.2) {
        scaleRef.current = 1;
        panRef.current = { x: 0, y: 0 };
        setScale(1);
        setPan({ x: 0, y: 0 });
      } else {
        const nextScale = 2.4;
        scaleRef.current = nextScale;
        setScale(nextScale);
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('dblclick', onDblClick);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('dblclick', onDblClick);
    };
  }, [zoomed, getBounds]);


  /* Zoom pill button (shared style) */
  const zoomBtnCls = 'absolute bottom-5 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 active:scale-95';

  return (
    <>
      {/* Card thumbnail */}
      <Link href={`/shop/product/${product._id}`} className="w-full rounded-2xl">
        <div className="relative w-full h-full rounded-xl overflow-hidden group">
          <div className="flex flex-col gap-1 absolute top-2 right-2 z-30 pointer-events-none">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); open(); }}
              title="Quick View"
              className="w-9 pointer-events-auto md:w-10 md:h-10 h-9 cursor-pointer hover:scale-110 transition-transform duration-300 bg-linear-to-t from-black/70 via-black/65 to-black/40 md:bg-black/45 md:backdrop-blur-sm bg-black/40 rounded-full flex justify-center items-center text-xs text-white font-medium"
            >
              <Scan size={14} />
            </button>
            <button
              type="button"
              title="Add to Cart"
              disabled={Boolean(flight)}
              onClick={handleAddToCart}
              className="w-9 pointer-events-auto h-9 md:w-10 md:h-10 cursor-pointer hover:scale-110 transition-transform duration-300 bg-linear-to-t from-black/70 via-black/65 to-black/40 md:bg-black/45 md:backdrop-blur-sm bg-black/40 rounded-full flex justify-center items-center text-xs text-white font-medium disabled:pointer-events-none disabled:opacity-70"
            >
              <ShoppingBasket size={14} />
            </button>
          </div>
          <ImageWithLoader
            ref={imageRef}
            src={product.imagesLink[0]}
            alt={product.title}
            width={150}
            height={150}
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
            quality={45}
            className="object-cover z-20 h-full w-full"
            containerClassName="relative w-full"
          />
          <div className="absolute w-[95%] mx-auto bottom-3 md:bottom-5 left-0 right-0 px-2 py-1.5 z-20 flex justify-between items-start bg-white rounded-xl shadow-sm">
            <p className="text-text text-xs min-[450px]:text-sm sm:text-base max-w-[70%] font-medium line-clamp-2">{product.title}</p>
            <p className="text-text text-xs min-[450px]:text-sm sm:text-base font-bold">{product.price}৳</p>
          </div>
        </div>
      </Link>

      {/* Quick-view modal */}
      {mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={product.title}
          className="fixed inset-0 z-200 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-10 overscroll-contain"
        >
          {/* Backdrop */}
          <div
            onClick={close}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            className="absolute pointer-events-auto inset-0 bg-black/70 md:backdrop-blur-md transition-opacity duration-300 touch-none"
            style={{ opacity: visible ? 1 : 0 }}
          />

          {/* Panel */}
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-100 z-10 shadow-2xl overflow-hidden transition-[opacity,transform] duration-300 ease-out"
            style={{
              height: '80svh',
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.95)',
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
            }}
          >
            {/* Close */}
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 z-40 flex h-9 w-9 items-center justify-center bg-black/60 hover:bg-black rounded-full text-white transition-colors cursor-pointer bg-linear-to-t from-black/90 via-black/75 to-black/40 md:bg-black/45 md:backdrop-blur-sm"
            >
              <X size={18} />
            </button>

            {/* ═══ IMAGE COLUMN ═══
                Desktop: width animates 50% ↔ 100%
                Mobile:  height animates 16rem ↔ 100% (grows to fill full modal) */}
            <div
              ref={imageViewRef}
              className={`relative shrink-0 overflow-hidden ${
                zoomed && scale > 1.05
                  ? isInteracting
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : zoomed
                  ? 'cursor-zoom-in'
                  : ''
              }`}
              style={isDesktop ? {
                width: zoomed ? '100%' : '50%',
                height: '100%',
                transition: `width ${ZOOM_MS}ms ${EASE}`,
                touchAction: zoomed ? 'none' : 'auto',
              } : {
                width: '100%',
                height: zoomed ? '100%' : '16rem',
                flexShrink: 0,
                transition: `height ${ZOOM_MS}ms ${EASE}`,
                touchAction: zoomed ? 'none' : 'auto',
              }}
            >
              <ScaledImage
                src={product.imagesLink[0]}
                alt={product.title}
                scale={scale}
                pan={pan}
                active={isInteracting}
              />
              {/* Image bottom fade */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/55 to-transparent" />

              {/* Zoom button (desktop & mobile) */}
              <button
                type="button"
                onClick={toggleZoom}
                aria-label={zoomed ? 'Minimize image' : 'Expand image'}
                className={zoomBtnCls}
              >
                {zoomed ? (
                  <>
                    <Minimize2 size={11} strokeWidth={2.5} />
                    <span>Minimize</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={11} strokeWidth={2.5} />
                    <span>Expand</span>
                  </>
                )}
              </button>

              {/* Gesture tip (shows when zoomed) */}
              {zoomed && <GestureTip visible={showTip} />}
            </div>

            {/* ═══ DETAILS COLUMN ═══
                Desktop: collapses width (max-width 50% → 0) as image expands
                Mobile:  collapses height (max-height 100% → 0) as image grows down */}
            <div
              style={isDesktop ? {
                flex: '1 1 auto',
                maxWidth: zoomed ? '0%' : '50%',
                opacity: zoomed ? 0 : 1,
                pointerEvents: zoomed ? 'none' : 'auto',
                overflow: 'hidden',
                transition: `max-width ${ZOOM_MS}ms ${EASE}, opacity ${Math.round(ZOOM_MS * 0.6)}ms ease`,
              } : {
                flex: zoomed ? '0 0 0px' : '1 1 0px',
                maxHeight: zoomed ? '0px' : '1000px',
                opacity: zoomed ? 0 : 1,
                pointerEvents: zoomed ? 'none' : 'auto',
                overflow: 'hidden',
                overflowY: zoomed ? 'hidden' : 'auto',
                overscrollBehavior: 'contain',
                transition: `max-height ${ZOOM_MS}ms ${EASE}, opacity ${Math.round(ZOOM_MS * 0.6)}ms ease, flex ${ZOOM_MS}ms ${EASE}`,
              }}
            >
              <div className="p-6 sm:p-8 h-full flex flex-col justify-between min-w-65">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">{product.title}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary">{product.price}৳</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Premium quality sportswear jersey engineered with moisture-wicking fabric and ergonomic athletic fit. Perfect for matches, training, or casual wear.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                  <AddToCartButton onAdd={() => addToCart(product, 1)} className="h-12 w-full rounded-xl shadow-md" />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cart fly clone */}
      {flight && createPortal(
        <AddToCartFlyClone src={flight.src} from={flight.from} to={flight.to} onDone={handleFlightDone} />,
        document.body
      )}
    </>
  );
}

export default ProductCard;
