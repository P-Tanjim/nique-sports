'use client';

// Safeguard against Next.js / React 19 dev server timing clock-skew
// where Server Component measures can have a negative timestamp in Chrome.
if (typeof window !== 'undefined' && window.performance) {
  try {
    if (typeof window.performance.measure === 'function') {
      const origMeasure = window.performance.measure.bind(window.performance);
      window.performance.measure = function () {
        try {
          return origMeasure.apply(window.performance, arguments);
        } catch (err) {
          const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
          if (msg.includes('negative') || msg.includes('time stamp')) {
            return null;
          }
          throw err;
        }
      };
    }
    if (typeof window.performance.mark === 'function') {
      const origMark = window.performance.mark.bind(window.performance);
      window.performance.mark = function () {
        try {
          return origMark.apply(window.performance, arguments);
        } catch (err) {
          const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
          if (msg.includes('negative') || msg.includes('time stamp')) {
            return null;
          }
          throw err;
        }
      };
    }
  } catch (_) {}
}

export default function PerformanceGuard() {
  return null;
}
