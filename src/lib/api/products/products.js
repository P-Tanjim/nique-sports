'use server'

import { serverPost } from '../core/core';

export async function createProduct(product) {
  return serverPost('/admin/products', product);
}