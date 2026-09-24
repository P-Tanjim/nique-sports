'use client';

import { useState } from 'react';
import Image from 'next/image';

// Client Component — the only interactive piece of the gallery is "which
// image is active", so this is the one part of the visual section that
// needs to ship JS; everything beside it (ProductInfo, badges, ...) stays
// server-rendered.
export default function ProductGallery({ images, title }) {
  const gallery = images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = gallery[activeIndex];

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-border bg-white text-sm text-text-muted">
        No image available
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-white">
        <Image
          loading="eager"
          key={activeImage}
          src={activeImage}
          alt={title || 'Product image'}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {gallery.map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20 ${
                index === activeIndex ? 'border-primary' : 'border-border hover:border-primary/40'
              }`}
            >
              <Image loading="eager" src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}