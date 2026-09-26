'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import GalleryFlyClone from './GalleryFlyClone';

export default function ProductGallery({ images, title }) {
  const gallery = images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [flying, setFlying] = useState(null); // { src, from, to, onGrown, onDone } | null
  const mainRef = useRef(null);
  const thumbRefs = useRef([]);

  const activeImage = gallery[activeIndex];

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

    // Nothing meaningful to animate — just swap.
    if (
      Math.abs(from.left - to.left) < 1 &&
      Math.abs(from.top - to.top) < 1 &&
      Math.abs(from.width - to.width) < 1
    ) {
      setActiveIndex(index);
      return;
    }

    // activeIndex deliberately does NOT change yet — the main div keeps
    // showing the previous image until the clone reports it has fully
    // grown (onGrown), which is what keeps the old picture visible for
    // the whole flight instead of swapping out early.
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
          sizes="(max-width: 1024px) 100vw, 50vw"
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
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20 ${
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