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

export default function DeferredFeatureCard({ cards = [], ...props }) {
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
    <div ref={hostRef} className="min-h-80 w-full">
      {shouldRender ? <FeatureCard cards={cards} {...props} /> : <FeatureCardPlaceholder />}
    </div>
  );
}

