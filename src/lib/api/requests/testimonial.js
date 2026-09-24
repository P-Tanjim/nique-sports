'use server'
import { serverFetch } from "../core/core";

export async function getTestimonials() {
  try {
    // Add revalidate to cache the response (e.g., updates every 1 hour)
    const res = await serverFetch(`/testimonials`, {
      next: { revalidate: 3600 },
    });
    
    return res.data || [];
    
  } catch (err) {
    console.error("Failed to fetch testimonials:", err);
    return [];
  }
}