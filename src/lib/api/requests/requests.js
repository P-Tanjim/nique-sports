'use server'

import { serverFetch } from "../core/core"
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(formData) {
  try {
    const file = formData.get("image");
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // 10 MB size limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "Image upload size limit is 8 MB" };
    }

    // Convert file object to a Data URI string for Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const fileUri = `data:${file.type};base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: "products", // Optional: organizes uploads in a specific Cloudinary folder
    });

    if (result && result.secure_url) {
      return { success: true, url: result.secure_url };
    } else {
      return { success: false, error: "Upload failed" };
    }
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return { success: false, error: "Server upload failed. Please try again." };
  }
}

export async function deleteFromCloudinary(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return { success: false, error: "Invalid URL" };
    }

    // 1. Split the URL to get everything after "/upload/"
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) {
      return { success: false, error: "Could not parse the image URL to delete" };
    }

    let publicId = urlParts[1];

    // 2. Remove the version string (e.g., v1790201086/) if it exists
    publicId = publicId.replace(/^v\d+\//, '');

    // 3. Remove the file extension (.jpg, .png, etc.)
    const extensionIndex = publicId.lastIndexOf('.');
    if (extensionIndex !== -1) {
      publicId = publicId.substring(0, extensionIndex);
    }

    // 4. Delete the file using the extracted public_id
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return { success: true, message: "Image remove"};
    } else {
      return { success: false, error: "Failed to delete from Cloudinary" };
    }
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return { success: false, error: "Server deletion failed" };
  }
}

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