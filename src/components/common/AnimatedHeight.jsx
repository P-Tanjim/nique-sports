'use client';

import { useLayoutEffect, useRef } from 'react';

const ROOM = 4; // px, so focus rings at the edges aren't clipped by overflow-hidden

export default function AnimatedHeight({ children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    const sync = () => {
      outer.style.height = `${Math.ceil(inner.getBoundingClientRect().height) + ROOM * 2}px`;
    };
    sync(); // before first paint, so it doesn't animate in from 0
    const observer = new ResizeObserver(sync);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="-m-1 overflow-hidden p-1 transition-[height] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    >
      <div ref={innerRef} className="flow-root">
        {children}
      </div>
    </div>
  );
}