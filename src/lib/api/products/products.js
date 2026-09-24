'use server'

import { serverFetch, serverPost } from '../core/core';

export async function createProduct(product) {
  return serverPost('/admin/products', product);
}

export async function getProducts(howMuch) {
  return serverFetch(`/products?limit=${howMuch}`)
}