/**
 * Automatically injects Cloudinary transformations (auto format, auto quality, max width)
 * to avoid serving heavy unoptimized camera images on mobile.
 */
export function optimizeCloudinaryUrl(url, width = 1200) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  // Avoid duplicate transformation injection
  if (url.includes('/f_auto,q_auto')) {
    return url;
  }
  return url.replace('/upload/', `/upload/f_auto,q_auto:best,w_${width}/`);
}
