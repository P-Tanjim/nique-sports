'use server'

import { serverFetch } from '../core/core';

// GET {API}/products/:id — add this route to your Express server (index.js)
// once it's ready. Expected response: { data: { ...the Mongo document... } }
//
// Your sample document has no `slug` field yet, so this treats whatever
// comes in as an identifier rather than a pretty slug — the simplest fix
// right now is linking to `/product/${product._id}` wherever you build
// product links (ProductCard, etc.) and querying Mongo by `_id` on the
// backend. See the bonus route snippet in the chat reply for a working
// example. Once you add a real `slug` field to the schema, swap the path
// below to match and nothing else in this file needs to change.
//
// Called from both generateMetadata() and the page itself — Next.js
// automatically dedupes identical fetch() calls made during the same
// render, so this only hits your API once per request even though it's
// called twice.
export const getProductById = async (id) => {
  const data = await serverFetch(`/products/${id}`);
  return data?.data ?? null;
};