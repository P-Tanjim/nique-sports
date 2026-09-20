'use server'

import { serverFetch } from "../core/core"

export const getFeaturedProducts = async () => {
  const data = await serverFetch('/featured-products');
  
  return data.data;
}