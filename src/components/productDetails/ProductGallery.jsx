'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getImageProps } from 'next/image';
import Image from 'next/image';
import GalleryFlyClone from './GalleryFlyClone';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

const MAIN_SIZES = '(max-width: 768px) 100vw, 50vw';

// Renders nothing visible — just <link rel="preload"> tags. React 19 hoists
// these straight into <head> no matter where in the tree they're rendered.
// Built with getImageProps so the generated URL/srcset is byte-for-byte
// what the real <Image> below will request — that's what makes it land in
// the SAME browser cache slot instead of triggering its own cold fetch.
function GalleryPreloadLinks({ images }) {
  return images.map((src) => {
    if (!src || src.startsWith('data:')) return null; // already inline, nothing to fetch
    const { props } = getImageProps({ src, alt: '', fill: true, sizes: MAIN_SIZES });
    return (
      <link
        key={src}
        rel="preload"
        as="image"
        href={props.src}
        imageSrcSet={props.srcSet}
        imageSizes={props.sizes}
      />
    );
  });
}

function handleSwipeStart(e) {
  swipeRef.current = { x: e.clientX, y: e.clientY };
  e.currentTarget.setPointerCapture?.(e.pointerId);
}

export default function ProductGallery({ images, title }) {
  const gallery = images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [flying, setFlying] = useState(null); // { src, from, to, onGrown, onDone } | null
  const mainRef = useRef(null);
  const thumbRefs = useRef([]);
  const thumbsRef = useRef(null);  // the thumbnail strip
  const swipeRef = useRef(null);   // tracks the swipe in progress

  const activeImage = gallery[activeIndex];

  // Lock scrolling completely while the clone is in flight to prevent the image from
  // drifting away from its landing target if the user scrolls, trackpad-wheels, or touch-swipes.
  useEffect(() => {
    if (!flying) return undefined;

    function preventScroll(e) {
      e.preventDefault();
    }

    function preventScrollKeys(e) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
      }
    }

    // Intercept wheel, touch gestures, and scroll keys at window capture level without
    // mutating html/body overflow (which breaks sticky navbar positioning)
    window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
    window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
    window.addEventListener('keydown', preventScrollKeys, { passive: false, capture: true });

    // Failsafe timer: ensure scroll is always restored even if an animation frame cancels
    const safetyTimer = setTimeout(() => {
      setFlying(null);
    }, 1200);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('wheel', preventScroll, { capture: true });
      window.removeEventListener('touchmove', preventScroll, { capture: true });
      window.removeEventListener('keydown', preventScrollKeys, { capture: true });
    };
  }, [flying]);

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-border bg-white text-sm text-text-muted">
        No image available
      </div>
    );
  }

  function handleThumbClick(index) {
    if (index === activeIndex || flying) return;

    const thumbEl = thumbRefs.current[index];
    const mainEl = mainRef.current;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!thumbEl || !mainEl || reduceMotion) {
      setActiveIndex(index);
      return;
    }

    revealThumb(index);

    const from = thumbEl.getBoundingClientRect();
    const to = mainEl.getBoundingClientRect();

    if (
      Math.abs(from.left - to.left) < 1 &&
      Math.abs(from.top - to.top) < 1 &&
      Math.abs(from.width - to.width) < 1
    ) {
      setActiveIndex(index);
      return;
    }

    setFlying({
      src: gallery[index],
      from,
      to,
      onGrown: () => setActiveIndex(index),
      onDone: () => setFlying(null),
    });
  }

  // If the incoming thumbnail is scrolled out of the strip, bring it into
  // view first so the fly animation always starts from a visible spot.
  function revealThumb(index) {
    const box = thumbsRef.current;
    const el = thumbRefs.current[index];
    if (!box || !el) return;
    const boxRect = box.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.left < boxRect.left || elRect.right > boxRect.right) {
      box.scrollLeft += elRect.left - boxRect.left - (boxRect.width - elRect.width) / 2;
    }
  }

  function goRelative(step) {
    if (gallery.length < 2) return;
    const next = (activeIndex + step + gallery.length) % gallery.length; // wraps around
    handleThumbClick(next); // same animation as a click
  }

  function handleSwipeStart(e) {
    if (flying) return;
    swipeRef.current = { x: e.clientX, y: e.clientY };
  }

  function handleSwipeEnd(e) {
    if (flying) {
      swipeRef.current = null;
      return;
    }
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // Must be a clearly horizontal gesture, not a tap or a vertical scroll.
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    goRelative(dx < 0 ? 1 : -1); // swipe left → next, swipe right → previous
  }

  return (
    <div>
      <GalleryPreloadLinks images={gallery} />

      <div
        ref={mainRef}
        onPointerDown={handleSwipeStart}
        onPointerUp={handleSwipeEnd}
        onPointerCancel={() => (swipeRef.current = null)}
        onDragStart={(e) => e.preventDefault()}
        className="relative aspect-square w-full touch-pan-y select-none overflow-hidden rounded-3xl border border-border bg-white"
      >
        <Image
          loading="eager"
          key={activeImage}
          src={activeImage}
          alt={title || 'Product image'}
          fill
          sizes={MAIN_SIZES}
          quality={85}
          priority
          fetchPriority="high"
          draggable={false}
          unoptimized={activeImage?.startsWith('data:')}
          className="object-cover opacity-100"
        />
      </div>

      {gallery.length > 1 && (
        <div ref={thumbsRef} className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {gallery.map((src, index) => (
            <button
              key={src + index}
              ref={(el) => {
                thumbRefs.current[index] = el;
              }}
              type="button"
              onClick={() => handleThumbClick(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 active:scale-90 sm:h-20 sm:w-20 ${index === activeIndex ? 'border-primary' : 'border-border hover:border-primary/40'
                }`}
            >
              <Image
                loading="eager"
                src={optimizeCloudinaryUrl(src, 300)}
                alt=""
                fill
                sizes="80px"
                quality={80}
                unoptimized={src?.startsWith('data:')}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {flying &&
        createPortal(
          <GalleryFlyClone
            key={flying.src}
            src={flying.src}
            from={flying.from}
            to={flying.to}
            onGrown={flying.onGrown}
            onDone={flying.onDone}
          />,
          document.body
        )}
    </div>
  );
}