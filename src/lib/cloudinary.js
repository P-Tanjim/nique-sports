/**
 * Automatically injects Cloudinary transformations (auto format, auto quality, max width)
 * to avoid serving heavy unoptimized camera images on mobile.
 */
export function optimizeCloudinaryUrl(url, width = 600) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  // Avoid duplicate transformation injection
  if (url.includes('/f_auto,q_auto')) {
    return url;
  }
  return url.replace('/upload/', `/upload/f_auto,q_auto:good,w_${width}/`);
}
