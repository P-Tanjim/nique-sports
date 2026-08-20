"use client";
import { sampleBrightnessBehind } from "@/utils/sampleBrightness";
import { useState, useEffect, useCallback, useRef } from "react";

export function useAdaptiveShadow(ref, { threshold = 128 } = {}) {
  const [isDarkBg, setIsDarkBg] = useState(false);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (!ref.current || busy.current) return;
    busy.current = true;
    const brightness = await sampleBrightnessBehind(ref.current);
    setIsDarkBg(brightness < threshold);
    busy.current = false;
  }, [ref, threshold]);

  useEffect(() => {
    check();
    let timeoutId;
    const onChange = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        check();
      }, 150);
    };
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [check]);

  return isDarkBg;
}