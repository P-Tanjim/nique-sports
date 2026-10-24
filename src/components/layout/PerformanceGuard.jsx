'use client';

import { useEffect } from 'react';

export default function PerformanceGuard() {
  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const isLowEnd = cores <= 4 || memory <= 4;

    if (isLowEnd) {
      // Set ONCE on mount — never toggle during scroll!
      document.documentElement.dataset.perfTier = 'low';
    }
  }, []);

  return null;
}
