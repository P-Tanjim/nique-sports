'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import Image from 'next/image';

// A smooth ease-out gives the grow a premium finish without an elastic overshoot.
const GROW_TRANSITION = { duration: 0.46, ease: [0.22, 1, 0.36, 1] };
const SHADOW_TRANSITION = { duration: 0.4, ease: 'easeOut' };
const FADE_TRANSITION = { duration: 0.15, ease: 'easeOut' };

const THUMB_RADIUS = 12; // matches rounded-xl on the thumbnail
const MAIN_RADIUS = 24; // matches rounded-3xl on the main frame

// A soft, CONSTANT shadow — only its opacity animates in. Only ever costs
// one extra compositor layer, never a per-frame shadow recalculation.
const ELEVATION_SHADOW =
  '0 32px 64px -24px rgba(32,36,38,0.35), 0 12px 28px -12px rgba(32,36,38,0.22)';

export default function GalleryFlyClone({ src, from, to, onGrown, onDone }) {
  const [scope, animate] = useAnimate();
  const shadowRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgElRef = useRef(null);
  const startedRef = useRef(false);

  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const scaleX = from.width / to.width;
  const scaleY = from.height / to.height;

  // Covers the case where the browser already had this image cached and it
  // finishes loading before the onLoad handler below even attaches.
  useEffect(() => {
    if (imgElRef.current?.complete) setImgLoaded(true);
  }, []);

  useEffect(() => {
    if (!imgLoaded || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      await animate(scope.current, { opacity: 1 }, { duration: 0 });
      if (cancelled) return;

      // Fire-and-forget — the shadow fade-in runs alongside the grow, so
      // the "lift" reads as part of one motion rather than a separate step.
      animate(shadowRef.current, { opacity: 1 }, SHADOW_TRANSITION);

      await animate(
        scope.current,
        { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: MAIN_RADIUS },
        GROW_TRANSITION
      );
      if (cancelled) return;

      // Fully grown — swap the real image in behind the clone *before*
      // fading, so the fade reveals the correct image already sitting
      // there instead of "reverting" to anything.
      onGrown();
      await animate(scope.current, { opacity: 0 }, FADE_TRANSITION);
      if (cancelled) return;

      onDone();
    })();

    return () => {
      cancelled = true;
    };
  }, [imgLoaded, animate, scope, onGrown, onDone]);

  return (
    <motion.div
      ref={scope}
      initial={{ x: dx, y: dy, scaleX, scaleY, borderRadius: THUMB_RADIUS, opacity: 0 }}
      style={{
        position: 'fixed',
        top: to.top,
        left: to.left,
        width: to.width,
        height: to.height,
        transformOrigin: '0 0',
        zIndex: 60,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    >
      {/* Sibling of the clipped image, not a child of it — so the image
          wrapper's overflow:hidden (needed to round its corners) never
          clips the shadow's own spread/blur. */}
      <div
        ref={shadowRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          boxShadow: ELEVATION_SHADOW,
          opacity: 0,
        }}
      />

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
        <Image
          ref={imgElRef}
          src={src}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized={src?.startsWith('data:')}
          onLoad={() => setImgLoaded(true)}
          className="object-cover"
        />
      </div>
    </motion.div>
  );
}