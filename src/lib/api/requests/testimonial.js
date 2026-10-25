'use server'
import { serverFetch } from "../core/core";

export async function getTestimonials() {
  try {
    const res = await serverFetch(`/testimonials`, {
      next: { revalidate: 60, tags: ['storefront'] },
    });
    
    return res.data || [];
    
  } catch (err) {
    console.error("Failed to fetch testimonials:", err);
    return [];
  }
}