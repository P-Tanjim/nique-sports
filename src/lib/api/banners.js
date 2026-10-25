'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/auth';
import { assertAdmin } from '@/lib/admin/guard';
import { v2 as cloudinary } from 'cloudinary';
import { optimizeCloudinaryUrl } from '@/lib/cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_KEYS = new Set(['hero_banner', 'cat_manufactured_retro', 'cat_player_edition']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const DEFAULT_BANNERS = {
  hero_banner: {
    key: 'hero_banner',
    type: 'banner',
    title: 'Hero Banner',
    subtitle: 'Main banner at the top of the homepage',
    imageUrl: 'https://res.cloudinary.com/wqfqifcs/image/upload/v1792880713/banners/hero_banner.webp',
    link: '/shop',
  },
  cat_manufactured_retro: {
    key: 'cat_manufactured_retro',
    type: 'category',
    title: 'Manufactured Retro',
    subtitle: 'Category 1 on homepage',
    imageUrl: 'https://res.cloudinary.com/wqfqifcs/image/upload/v1792880714/banners/cat_manufactured_retro.webp',
    link: '/shop?category=manufactured-retro',
    categorySlug: 'manufactured-retro',
  },
  cat_player_edition: {
    key: 'cat_player_edition',
    type: 'category',
    title: 'Player Edition',
    subtitle: 'Category 2 on homepage',
    imageUrl: 'https://res.cloudinary.com/wqfqifcs/image/upload/v1792880715/banners/cat_player_edition.webp',
    link: '/shop?category=player-edition',
    categorySlug: 'player-edition',
  },
};

export async function getBanners() {
  try {
    const docs = await db.collection('banners').find({}).toArray();
    const map = { ...DEFAULT_BANNERS };
    docs.forEach((doc) => {
      if (doc.key && ALLOWED_KEYS.has(doc.key)) {
        map[doc.key] = {
          ...doc,
          _id: String(doc._id),
          imageUrl: optimizeCloudinaryUrl(doc.imageUrl),
        };
      }
    });
    return map;
  } catch (err) {
    console.error('Failed to get banners from DB:', err);
    return DEFAULT_BANNERS;
  }
}

export async function updateBannerImage(formData) {
  // 1. Authentication & Role Authorization Guard (Database-backed session via Better Auth)
  await assertAdmin();

  const key = formData.get('key');
  const file = formData.get('image');

  // 2. Strict Key Whitelist (Prevents arbitrary file overwriting and MongoDB injection)
  if (!key || typeof key !== 'string' || !ALLOWED_KEYS.has(key)) {
    return { success: false, error: 'Invalid or unauthorized banner key' };
  }

  // 3. File presence check
  if (!file || typeof file === 'string') {
    return { success: false, error: 'No image file provided' };
  }

  // 4. File Size Verification (Server-side defense against DoS / memory exhaustion)
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'Image exceeds maximum allowed size of 10MB' };
  }

  // 5. MIME Type Verification (Ensures only safe image formats)
  const mimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { success: false, error: 'Invalid file format. Only JPEG, PNG, WEBP, and AVIF images are supported' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const fileUri = `data:${mimeType};base64,${base64Data}`;

    // 6. Safe Cloudinary Upload restricted to images only
    const uploadRes = await cloudinary.uploader.upload(fileUri, {
      folder: 'banners',
      public_id: key,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });

    if (!uploadRes?.secure_url) {
      return { success: false, error: 'Cloudinary upload failed' };
    }

    const secureUrl = uploadRes.secure_url;

    // 7. Safe MongoDB update
    await db.collection('banners').updateOne(
      { key },
      {
        $set: {
          key,
          imageUrl: secureUrl,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 8. Revalidate paths and tags
    revalidateTag('storefront');
    revalidatePath('/', 'page');
    revalidatePath('/shop', 'page');
    revalidatePath('/dashboard/banners', 'page');

    return {
      success: true,
      url: optimizeCloudinaryUrl(secureUrl),
      key,
    };
  } catch (err) {
    console.error('Failed to update banner:', err);
    return { success: false, error: 'Failed to upload and update banner. Please try again.' };
  }
}
