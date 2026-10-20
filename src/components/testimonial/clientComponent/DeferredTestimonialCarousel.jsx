"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const TestimonialCarousel = dynamic(() => import("./cards"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-[420px]" />,
});

export default function DeferredTestimonialCarousel({
  testimonials,
  autoPlay,
  autoPlayInterval,
}) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setShouldLoad(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-h-[420px]">
      {shouldLoad && (
        <TestimonialCarousel
          testimonials={testimonials}
          autoPlay={autoPlay}
          autoPlayInterval={autoPlayInterval}
        />
      )}
    </div>
  );
}
