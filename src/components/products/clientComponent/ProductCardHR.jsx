'use client'
import Link from 'next/link'
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

/* ─── Gesture tutorial ─── */
const GESTURE_CSS = `
  @keyframes qv-finger-l {
    0%,8%    { transform:translate(0,0); opacity:0; }
    18%      { opacity:1; }
    52%      { transform:translate(-22px,-22px); opacity:1; }
    72%      { transform:translate(-22px,-22px); opacity:1; }
    88%      { transform:translate(0,0); opacity:1; }
    98%,100% { transform:translate(0,0); opacity:0; }
  }
  @keyframes qv-finger-r {
    0%,8%    { transform:translate(0,0); opacity:0; }
    18%      { opacity:1; }
    52%      { transform:translate(22px,22px); opacity:1; }
    72%      { transform:translate(22px,22px); opacity:1; }
    88%      { transform:translate(0,0); opacity:1; }
    98%,100% { transform:translate(0,0); opacity:0; }
  }
  .qv-fl { animation: qv-finger-l 2.4s ease-in-out infinite; }
  .qv-fr { animation: qv-finger-r 2.4s ease-in-out infinite; }
`;

function Finger() {
  return (
    <svg width="26" height="44" viewBox="0 0 26 44" fill="none">
      <rect x="2" y="12" width="22" height="30" rx="11" fill="white" fillOpacity="0.96" />
      <ellipse cx="13" cy="12" rx="11" ry="11" fill="white" fillOpacity="0.96" />
      <rect x="6" y="3" width="14" height="10" rx="5" fill="#c8d0d0" fillOpacity="0.7" />
      <line x1="5" y1="32" x2="21" y2="32" stroke="#d8e0e0" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="36" x2="21" y2="36" stroke="#d8e0e0" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function GestureTip({ visible }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-30"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 500ms ease' }}
    >
      <style>{GESTURE_CSS}</style>
      {visible && (
        <div
          className="flex flex-col items-center gap-5 rounded-2xl px-10 py-7"
          style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(6px)' }}
        >
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="qv-fl absolute" style={{ top: '50%', left: '50%', marginTop: -22, marginLeft: -13 }}>
              <Finger />
            </div>
            <div className="qv-fr absolute" style={{ top: '50%', left: '50%', marginTop: -22, marginLeft: -13 }}>
              <Finger />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
            Pinch to zoom
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Scaled image ─── */
function ScaledImage({ src, alt, pinchScale, pinchActive }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `scale(${pinchScale})`,
        transformOrigin: 'center center',
        transition: pinchActive ? 'none' : 'transform 280ms ease-out',
        willChange: pinchActive ? 'transform' : 'auto',
      }}
    >
      <ImageWithLoader
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
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
  const [zoomOverlayVisible, setZoomOverlayVisible] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  const [pinchActive, setPinchActive] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getServerSnapshot);
  const imageViewRef = useRef(null);
  const pinchScaleRef = useRef(1);
  const pinchStateRef = useRef({ tracking: false, startDist: 0, startScale: 1 });
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
    setZoomOverlayVisible(false);
    setPinchScale(1);
    setShowTip(false);
    clearTimeout(tipTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
    }, TRANSITION_MS);
  }, []);

  function toggleZoom() {
    if (zoomed) {
      setZoomOverlayVisible(false);
      setTimeout(() => setZoomed(false), ZOOM_MS);
      setShowTip(false);
      clearTimeout(tipTimerRef.current);
    } else {
      setZoomed(true);
      setPinchScale(1);
      requestAnimationFrame(() => requestAnimationFrame(() => setZoomOverlayVisible(true)));
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('nqs_pinch_tip')) {
        sessionStorage.setItem('nqs_pinch_tip', '1');
        tipTimerRef.current = setTimeout(() => {
          setShowTip(true);
          tipTimerRef.current = setTimeout(() => setShowTip(false), 2800);
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

  useEffect(() => { pinchScaleRef.current = pinchScale; }, [pinchScale]);

  useEffect(() => {
    const el = imageViewRef.current;
    if (!el || !zoomed) return;
    function dist(t) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    }
    function onStart(e) {
      if (e.touches.length !== 2) return;
      pinchStateRef.current = { tracking: true, startDist: dist(e.touches), startScale: pinchScaleRef.current };
      setPinchActive(true);
    }
    function onMove(e) {
      if (!pinchStateRef.current.tracking || e.touches.length !== 2) return;
      e.preventDefault();
      const d = dist(e.touches);
      const s = pinchStateRef.current.startScale * (d / pinchStateRef.current.startDist);
      setPinchScale(Math.min(4, Math.max(1, s)));
    }
    function onEnd() {
      if (!pinchStateRef.current.tracking) return;
      pinchStateRef.current.tracking = false;
      setPinchActive(false);
      setPinchScale(s => (s < 1.12 ? 1 : s));
    }
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [zoomed]);


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
                Mobile:  fixed 16rem height; overlay covers it when zoomed */}
            <div
              ref={isDesktop ? imageViewRef : undefined}
              className="relative shrink-0 overflow-hidden"
              style={isDesktop ? {
                width: zoomed ? '100%' : '50%',
                height: '100%',
                transition: `width ${ZOOM_MS}ms ${EASE}`,
              } : {
                width: '100%',
                height: '16rem',
                flexShrink: 0,
              }}
            >
              <ScaledImage
                src={product.imagesLink[0]}
                alt={product.title}
                pinchScale={pinchScale}
                pinchActive={pinchActive}
              />
              {/* Image bottom fade */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />

              {/* Zoom button (desktop) */}
              {isDesktop && (
                <button type="button" onClick={toggleZoom} aria-label={zoomed ? 'Minimize image' : 'Expand image'} className={zoomBtnCls}>
                  {zoomed
                    ? <><Minimize2 size={11} strokeWidth={2.5} /><span>Minimize</span></>
                    : <><Maximize2 size={11} strokeWidth={2.5} /><span>Expand</span></>
                  }
                </button>
              )}
              {/* Gesture tip (desktop) */}
              {isDesktop && <GestureTip visible={showTip} />}
            </div>

            {/* ═══ DETAILS COLUMN ═══
                Desktop: collapses (max-width 50% → 0) as image expands
                Mobile:  stays visible; overlay covers it when zoomed */}
            <div
              style={isDesktop ? {
                flex: '1 1 auto',
                maxWidth: zoomed ? '0%' : '50%',
                opacity: zoomed ? 0 : 1,
                pointerEvents: zoomed ? 'none' : 'auto',
                overflow: 'hidden',
                transition: `max-width ${ZOOM_MS}ms ${EASE}, opacity ${Math.round(ZOOM_MS * 0.6)}ms ease`,
              } : {
                flex: '1 1 0',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              <div className="p-6 sm:p-8 h-full flex flex-col justify-between min-w-[260px]">
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

            {/* ═══ MOBILE ZOOM OVERLAY ═══
                position:absolute inside the panel so no layout shift occurs.
                Fade + scale in on top of the details column. */}
            {!isDesktop && zoomed && (
              <div
                ref={imageViewRef}
                className="absolute inset-0 z-20 overflow-hidden bg-black"
                style={{
                  opacity: zoomOverlayVisible ? 1 : 0,
                  transform: zoomOverlayVisible ? 'scale(1)' : 'scale(1.04)',
                  transition: `opacity ${ZOOM_MS}ms ${EASE}, transform ${ZOOM_MS}ms ${EASE}`,
                }}
              >
                <ScaledImage
                  src={product.imagesLink[0]}
                  alt={product.title}
                  pinchScale={pinchScale}
                  pinchActive={pinchActive}
                />
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
                <button type="button" onClick={toggleZoom} aria-label="Minimize image" className={zoomBtnCls}>
                  <Minimize2 size={11} strokeWidth={2.5} /><span>Minimize</span>
                </button>
                <GestureTip visible={showTip} />
              </div>
            )}

            {/* Expand button on mobile (sits at bottom of the image strip) */}
            {!isDesktop && !zoomed && (
              <button
                type="button"
                onClick={toggleZoom}
                aria-label="Expand image"
                className={zoomBtnCls}
                style={{ bottom: 'calc(80svh - 16rem + 1.25rem)' }}
              >
                <Maximize2 size={11} strokeWidth={2.5} /><span>Expand</span>
              </button>
            )}
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
