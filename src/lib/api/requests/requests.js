'use server'

import { serverFetch } from "../core/core"

export const getFeaturedProducts = async () => {
  const data = await serverFetch('/featured-products');
  
  return data.data;
}

export async function uploadToImgBB(formData) {
  try {
    const file = formData.get("image");
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Server-side check for 1MB
    const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: "Image upload size limit is 8 MB" };
    }

    const apiKey = process.env.IMGBB_KEY;

    const imgbbFormData = new FormData();
    imgbbFormData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgbbFormData,
    });

    const json = await res.json();

    if (json.success) {
      return { success: true, url: json.data.url };
    } else {
      return { success: false, error: json.error?.message || "Upload failed" };
    }
  } catch (err) {
    return { success: false, error: "Server upload failed. Please try again." };
  }
}