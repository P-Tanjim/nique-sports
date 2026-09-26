'use server'

import { revalidatePath } from 'next/cache';
import { serverFetch, serverPost } from '../core/core';

export async function createProduct(product) {
  const result = await serverPost('/admin/products', product);

  if (result?.success) {
    revalidatePath('/', 'page');
  }

  return result;
}

export async function getFeaturedProductCount() {
  const result = await serverFetch('/admin/feature-count');
  return typeof result?.data === 'number' ? result.data : null;
}

function toSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function normalizeProduct(product) {
  const price = Number(product?.price) || 0;
  const beforePrice = Number(product?.beforePrice) || 0;
  const hasDiscount = Boolean(product?.discount) && beforePrice > price;

  return {
    ...product,
    name: product?.title,
    image: product?.imagesLink?.[0] ?? null,
    slug: product?._id,
    originalPrice: hasDiscount ? beforePrice : null,
    discountPercent: hasDiscount
      ? Math.round(((beforePrice - price) / beforePrice) * 100)
      : 0,
    createdAt: product?.createdAt ? new Date(product.createdAt).getTime() : 0,
  };
}

async function fetchProducts(limit = 1000) {
  const res = await serverFetch(`/products?limit=${limit}`);
  const products = res?.data || res?.products || [];
  return Array.isArray(products) ? products.map(normalizeProduct) : [];
}

export async function getProducts(options = 10) {
  if (typeof options === 'number') return fetchProducts(options);

  const {
    category = 'all',
    minPrice,
    maxPrice,
    sort = 'default',
    perPage = 12,
    page = 1,
  } = options;

  let items = await fetchProducts();

  if (category && category !== 'all') {
    items = items.filter((product) => toSlug(product.category) === category);
  }
  if (minPrice !== undefined && minPrice !== '') {
    items = items.filter((product) => product.price >= Number(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    items = items.filter((product) => product.price <= Number(maxPrice));
  }

  const sorters = {
    default: (a, b) => String(a._id).localeCompare(String(b._id)),
    newest: (a, b) => b.createdAt - a.createdAt,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    discount: (a, b) => b.discountPercent - a.discountPercent,
  };
  items.sort(sorters[sort] ?? sorters.default);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    totalPages,
    page: safePage,
  };
}

export async function getShopCategories() {
  const products = await fetchProducts();
  const categories = new Map();

  products.forEach((product) => {
    if (!product.category) return;
    const slug = toSlug(product.category);
    const current = categories.get(slug) || { slug, name: product.category, count: 0 };
    categories.set(slug, { ...current, count: current.count + 1 });
  });

  return Array.from(categories.values());
}

export async function getShopPriceBounds() {
  const products = await fetchProducts();
  const prices = products.map((product) => product.price);

  return {
    min: prices.length ? Math.min(...prices) : 0,
    max: prices.length ? Math.max(...prices) : 0,
  };
}