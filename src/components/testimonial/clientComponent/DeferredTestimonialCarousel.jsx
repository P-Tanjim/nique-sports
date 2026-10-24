"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const TestimonialCarousel = dynamic(() => import("./cards"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="min-h-[420px]" />,
});

export default function DeferredTestimonialCarousel({
  testimonials,
  autoPlay,
  autoPlayInterval,
  ...props
}) {
  const hostRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;
    const el = hostRef.current;

    // 1. Mount well before the viewport reaches it (900px ahead)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          io.disconnect();
        }
      },
      { rootMargin: "900px 0px" }
    );
    if (el) io.observe(el);

    // 2. Also pre-mount during browser idle time after LCP finishes (2.5s)
    // so it NEVER mounts mid-scroll on a low-end phone
    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setShouldRender(true), { timeout: 2500 })
        : setTimeout(() => setShouldRender(true), 2500);

    return () => {
      io.disconnect();
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
    };
  }, [shouldRender]);

  return (
    <div ref={hostRef} className="min-h-[420px] w-full">
      {shouldRender ? (
        <TestimonialCarousel
          testimonials={testimonials}
          autoPlay={autoPlay}
          autoPlayInterval={autoPlayInterval}
          {...props}
        />
      ) : (
        <div aria-hidden="true" className="min-h-[420px]" />
      )}
    </div>
  );
}

