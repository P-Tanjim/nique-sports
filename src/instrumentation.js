export function register() {
  if (typeof globalThis.performance !== 'undefined') {
    if (typeof globalThis.performance.measure === 'function') {
      const origMeasure = globalThis.performance.measure.bind(globalThis.performance);
      globalThis.performance.measure = function () {
        try {
          return origMeasure.apply(globalThis.performance, arguments);
        } catch (err) {
          const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
          if (msg.includes('negative') || msg.includes('time stamp')) {
            return null;
          }
          throw err;
        }
      };
    }
    if (typeof globalThis.performance.mark === 'function') {
      const origMark = globalThis.performance.mark.bind(globalThis.performance);
      globalThis.performance.mark = function () {
        try {
          return origMark.apply(globalThis.performance, arguments);
        } catch (err) {
          const msg = (err && err.message) ? String(err.message).toLowerCase() : '';
          if (msg.includes('negative') || msg.includes('time stamp')) {
            return null;
          }
          throw err;
        }
      };
    }
  }
}
