'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import Image from 'next/image';

// Fixed-duration tweens only — no spring. Springs settle asymptotically
// and fire onComplete a beat before they're visually still, which is
// exactly what caused the "pops back" glitch. A tween finishes exactly
// when it says it will, so nothing can visually rebound.
const GROW_TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] };
const FADE_TRANSITION = { duration: 0.15, ease: 'easeOut' };

const THUMB_RADIUS = 12; // matches rounded-xl on the thumbnail
const MAIN_RADIUS = 24; // matches rounded-3xl on the main frame

export default function GalleryFlyClone({ src, from, to, onGrown, onDone }) {
  const [scope, animate] = useAnimate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgElRef = useRef(null);
  const startedRef = useRef(false);

  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const scaleX = from.width / to.width;
  const scaleY = from.height / to.height;

  // Covers the case where the browser already has this image cached and
  // it finishes loading before the onLoad handler below even attaches —
  // a classic gotcha that leaves onLoad never firing at all.
  useEffect(() => {
    if (imgElRef.current?.complete) setImgLoaded(true);
  }, []);

  // Every side effect lives in here, gated on the image actually being
  // ready. Nothing runs during render, so nothing can update state
  // before this component (or its parent) has finished mounting.
  useEffect(() => {
    if (!imgLoaded || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      // Reveal at the thumbnail's spot — instant, and invisible, since
      // the clone is sitting exactly on top of the real thumbnail and
      // the image is already loaded, so there's no blank flash.
      await animate(scope.current, { opacity: 1 }, { duration: 0 });
      if (cancelled) return;

      await animate(
        scope.current,
        { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: MAIN_RADIUS },
        GROW_TRANSITION
      );
      if (cancelled) return;

      // Fully grown now — swap the real image in behind the clone
      // *before* fading, so the fade reveals the correct image already
      // sitting there instead of "reverting" to anything.
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
        overflow: 'hidden',
        zIndex: 60,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    >
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
    </motion.div>
  );
}