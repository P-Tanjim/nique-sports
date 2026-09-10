// lib/products.js
//
// Mock data layer for the Shop page. Swap the bodies of getCategories(),
// getPriceBounds() and getProducts() for real calls to your database or API —
// every Shop component only depends on the shapes returned here.
import { cache } from 'react';

// Matches your real site nav (minus "Home", which isn't a product category).
export const CATEGORIES = [
  { slug: 'bd-premium', name: 'BD Premium' },
  { slug: 'manufactured-retro', name: 'Manufactured Retro' },
  { slug: 'player-edition-replica', name: 'Player Edition Replica' },
  { slug: 'player-edition', name: 'Player Edition' },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generates a small inline SVG (as a data: URI) so the demo has zero
// external network dependency — no placehold.co, no possible 400, works
// offline. Swap product.image for a real photo path/CDN URL when you wire
// this up to real inventory; see the `unoptimized` note in ProductCard.js.
function placeholderImage(name) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#eef6f7"/>
        <stop offset="100%" stop-color="#d9e4e6"/>
      </linearGradient>
    </defs>
    <rect width="700" height="700" fill="url(#bg)"/>
    <circle cx="350" cy="350" r="180" fill="#ffffff" opacity="0.55"/>
    <text x="350" y="350" font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="140" font-weight="600" fill="#308898" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeProduct({ id, name, category, price, originalPrice, isNew, stamp, daysAgo = 0 }) {
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return {
    id,
    slug: `${category}-${id}`,
    name,
    category,
    price,
    originalPrice: originalPrice ?? null,
    discountPercent,
    isNew: Boolean(isNew),
    stamp: stamp ?? null,
    image: placeholderImage(name),
    createdAt: Date.now() - daysAgo * 86_400_000,
  };
}

const CATEGORY_PRODUCTS = {
  'bd-premium': [
    'BD Premium Home Jersey',
    'BD Premium Away Jersey',
    'BD Premium Third Jersey',
    'BD Premium Training Jersey',
    'BD Premium Goalkeeper Jersey',
    'BD Premium Anthem Jacket',
    'BD Premium Polo',
    'BD Premium Cap',
  ],
  'manufactured-retro': [
    '90s Retro Home Jersey',
    'Vintage Away Kit',
    'Classic Retro Third Kit',
    'Heritage Retro Training Top',
    'Retro Anniversary Edition',
  ],
  'player-edition-replica': [
    'Home Replica — Player Edition',
    'Away Replica — Player Edition',
    'Third Replica — Player Edition',
    'Goalkeeper Replica — Player Edition',
    'Training Replica — Player Edition',
    'Pre-Match Replica Shirt',
    'Anthem Replica Jacket',
    'Replica Player Edition II',
    'Replica Player Edition III',
    'Replica Player Edition IV',
  ],
  'player-edition': [
    'Home Player Edition',
    'Away Player Edition',
    'Third Player Edition',
    'Goalkeeper Player Edition',
    'Anthem Jacket — Player Edition',
    'Training Jersey — Player Edition',
    'Pre-Match Shirt — Player Edition',
    'Anniversary Player Edition',
    'Player Edition II',
    'Player Edition III',
    'Player Edition IV',
    'Player Edition V',
  ],
};

let _id = 1;
const nextId = () => _id++;

export const PRODUCTS = Object.entries(CATEGORY_PRODUCTS).flatMap(([category, names]) =>
  names.map((name, i) =>
    makeProduct({
      id: nextId(),
      name: `${name} 26/27`,
      category,
      price: 1050 + (i % 5) * 40,
      originalPrice: i % 3 === 0 ? 1280 + (i % 5) * 30 : null,
      isNew: i % 4 === 0,
      stamp: category === 'bd-premium' && i === 0 ? 'Authentic' : null,
      daysAgo: i * 3,
    })
  )
);

export const getCategories = cache(async function getCategories() {
  await wait(80); // simulated latency — remove once this hits a real source
  return CATEGORIES.map((c) => ({
    ...c,
    count: PRODUCTS.filter((p) => p.category === c.slug).length,
  }));
});

export const getPriceBounds = cache(async function getPriceBounds() {
  await wait(50);
  const prices = PRODUCTS.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
});

const SORTERS = {
  default: (a, b) => a.id - b.id,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => b.createdAt - a.createdAt,
  discount: (a, b) => b.discountPercent - a.discountPercent,
};

export async function getProducts({
  category = 'all',
  minPrice,
  maxPrice,
  sort = 'default',
  perPage = 12,
  page = 1,
} = {}) {
  // Simulated network/database latency so the Suspense fallback is actually
  // visible. This is the one call the ProductGrid Suspense boundary waits on.
  await wait(450);

  let items = PRODUCTS;

  if (category && category !== 'all') {
    items = items.filter((p) => p.category === category);
  }
  if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));

  items = [...items].sort(SORTERS[sort] ?? SORTERS.default);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    totalPages,
    page: safePage,
  };
}