"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function FeatureCardPlaceholder() {
  return (
    <section className="flex w-full flex-col items-center px-4 py-4 md:px-8 lg:py-8">
      <div className="flex w-full max-w-360 items-center justify-center">
        <div className="fan-layout relative flex h-96 w-full max-w-7xl items-center justify-center sm:h-112 md:h-136" />
      </div>
      <div aria-hidden="true" className="mt-4 h-12 md:mt-6" />
    </section>
  );
}

const FeatureCard = dynamic(() => import("./FeatureCard"), {
  ssr: false,
  loading: FeatureCardPlaceholder,
});

export default function DeferredFeatureCard({ cards = [] }) {
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
    <div ref={containerRef} className="w-full">
      {shouldLoad ? <FeatureCard cards={cards} /> : <FeatureCardPlaceholder />}
    </div>
  );
}
