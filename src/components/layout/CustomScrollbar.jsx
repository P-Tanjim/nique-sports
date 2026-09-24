'use client';

import { useEffect, useState } from 'react';

const MIN_THUMB_HEIGHT = 32;

function getMetrics() {
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const maxScroll = Math.max(0, documentHeight - viewportHeight);
  const thumbHeight = maxScroll
    ? Math.max(MIN_THUMB_HEIGHT, (viewportHeight / documentHeight) * viewportHeight)
    : 0;
  const maxThumbTop = Math.max(0, viewportHeight - thumbHeight);
  const thumbTop = maxScroll ? (window.scrollY / maxScroll) * maxThumbTop : 0;

  return { thumbHeight, thumbTop, visible: maxScroll > 0 };
}

export default function CustomScrollbar() {
  const [metrics, setMetrics] = useState({ thumbHeight: 0, thumbTop: 0, visible: false });

  useEffect(() => {
    let frameId;

    function update() {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setMetrics(getMetrics()));
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  if (!metrics.visible) return null;

  function handlePointerDown(event) {
    event.preventDefault();
    const startY = event.clientY;
    const startScroll = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const maxThumbTop = window.innerHeight - metrics.thumbHeight;

    function move(moveEvent) {
      const scrollRatio = (moveEvent.clientY - startY) / maxThumbTop;
      window.scrollTo({ top: startScroll + scrollRatio * maxScroll });
    }

    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none hidden md:flex fixed inset-y-0 right-0 z-99999 w-2"
    >
      <span
        onPointerDown={handlePointerDown}
        className="pointer-events-auto absolute right-0 w-2 cursor-grab rounded-full bg-primary transition-[top,height] duration-75 hover:bg-primary-dark active:cursor-grabbing"
        style={{ top: metrics.thumbTop, height: metrics.thumbHeight }}
      />
    </div>
  );
}
