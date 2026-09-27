'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getImageProps } from 'next/image';
import Image from 'next/image';
import GalleryFlyClone from './GalleryFlyClone';

const MAIN_SIZES = '(max-width: 1024px) 100vw, 50vw';

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

export default function ProductGallery({ images, title }) {
  const gallery = images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [flying, setFlying] = useState(null); // { src, from, to, onGrown, onDone } | null
  const mainRef = useRef(null);
  const thumbRefs = useRef([]);

  const activeImage = gallery[activeIndex];

  // A fixed-position clone is anchored to the viewport, not the page — if
  // the user scrolls mid-flight, the from/to rects captured at click time
  // go stale and it visibly lands in the wrong spot. Locking scroll for the
  // brief flight avoids that entirely, and matches how this app's other
  // overlays (drawers, modals) already behave while open.
  useEffect(() => {
    if (!flying) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
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

  return (
    <div>
      <GalleryPreloadLinks images={gallery} />

      <div
        ref={mainRef}
        className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-white"
      >
        <Image
          loading="eager"
          key={activeImage}
          src={activeImage}
          alt={title || 'Product image'}
          fill
          sizes={MAIN_SIZES}
          priority
          unoptimized={activeImage?.startsWith('data:')}
          className="object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
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
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 active:scale-90 sm:h-20 sm:w-20 ${
                index === activeIndex ? 'border-primary' : 'border-border hover:border-primary/40'
              }`}
            >
              <Image
                loading="eager"
                src={src}
                alt=""
                fill
                sizes="80px"
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