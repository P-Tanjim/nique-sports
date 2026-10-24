'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const FLIGHT_DURATION_MS = 480;
const FLIGHT_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export default function AddToCartFlyClone({ src, from, to, onDone }) {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const scaleX = from.width / to.width;
  const scaleY = from.height / to.height;
  const [launched, setLaunched] = useState(false);
  const completedRef = useRef(false);
  const fallbackTimerRef = useRef(null);

  function finish() {
    if (completedRef.current) return;
    completedRef.current = true;
    onDone();
  }

  useEffect(() => {
    function preventScroll(e) {
      e.preventDefault();
    }

    function preventScrollKeys(e) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
      }
    }

    // Intercept wheel, touch gestures, and scroll keys at capture level without mutating
    // document.documentElement / body overflow (which breaks position: sticky on the top navbar).
    window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
    window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
    window.addEventListener('keydown', preventScrollKeys, { passive: false, capture: true });

    let firstFrame;
    let secondFrame;

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setLaunched(true));
    });
    fallbackTimerRef.current = window.setTimeout(finish, FLIGHT_DURATION_MS + 160);

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallbackTimerRef.current);

      window.removeEventListener('wheel', preventScroll, { capture: true });
      window.removeEventListener('touchmove', preventScroll, { capture: true });
      window.removeEventListener('keydown', preventScrollKeys, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTransitionEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
    window.clearTimeout(fallbackTimerRef.current);
    finish();
  }

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        top: to.top,
        left: to.left,
        width: to.width,
        height: to.height,
        borderRadius: '9999px',
        overflow: 'hidden',
        transformOrigin: '0 0',
        transform: launched
          ? 'translate3d(0, 0, 0) scale(1, 1)'
          : `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
        opacity: launched ? 0 : 1,
        transition: launched
          ? `transform ${FLIGHT_DURATION_MS}ms ${FLIGHT_EASE}, opacity 120ms ease-out ${FLIGHT_DURATION_MS - 120}ms`
          : 'none',
        zIndex: 200,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
        boxShadow: '0 10px 24px -10px rgba(32,36,38,0.35)',
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="64px"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}