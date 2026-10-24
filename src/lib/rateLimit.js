import 'server-only';

// Best-effort in-memory limiter (per server instance). Good enough to stop
// double-clicks / bots hammering one instance; not a hard global limit.
const buckets = new Map();

export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset <= now) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  }
  b.count += 1;
  return b.count <= max;
}
