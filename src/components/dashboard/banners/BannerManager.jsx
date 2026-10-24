'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateBannerImage } from '@/lib/api/banners';

function BannerCard({
  bannerKey,
  title,
  subtitle,
  categoryHeading,
  type,
  aspectRatio = 'aspect-video',
  currentUrl,
  link,
  onImageUpdated,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const fileInputRef = useRef(null);

  const handleCardClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again if needed
    e.target.value = '';

    // File validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP, AVIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Optimistic local preview
    const localUrl = URL.createObjectURL(file);
    const previousUrl = previewUrl;
    setPreviewUrl(localUrl);
    setIsUploading(true);
    const toastId = toast.loading(`Uploading "${title}" to Cloudinary...`);

    try {
      const formData = new FormData();
      formData.append('key', bannerKey);
      formData.append('image', file);

      const res = await updateBannerImage(formData);

      if (!res.success) {
        throw new Error(res.error || 'Upload failed');
      }

      setPreviewUrl(res.url);
      onImageUpdated?.(bannerKey, res.url);
      toast.success(`${title} updated successfully!`, { id: toastId });
    } catch (err) {
      console.error('Failed to upload image:', err);
      setPreviewUrl(previousUrl);
      toast.error(err.message || 'Failed to update image', { id: toastId });
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  return (
    <div className="group/card relative overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:p-7">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Header Info */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 size={13} /> Cloudinary & DB Synced
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-text sm:text-xl">
            {categoryHeading || title}
          </h2>
        </div>
      </div>

      {/* Image Preview / Clickable Upload Trigger */}
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`Change image for ${title}`}
        className={`group/img relative w-full cursor-pointer overflow-hidden rounded-2xl border border-black/10 bg-surface transition-all duration-300 ${aspectRatio} hover:border-primary/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 900px, 100vw"
            className={`object-cover transition-transform duration-500 ease-out group-hover/img:scale-105 ${
              isUploading ? 'opacity-40 blur-[2px]' : ''
            }`}
            unoptimized={previewUrl.startsWith('blob:')}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-text-muted">
            <ImageIcon size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">No image loaded</p>
          </div>
        )}

        {/* Hover / Tap Overlay Prompt */}
        {!isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 p-4 text-white opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover/img:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-md backdrop-blur-md transition-transform duration-200 group-hover/img:scale-110">
              <Camera size={22} />
            </div>
            <p className="text-sm font-semibold tracking-wide drop-shadow-sm sm:text-base">
              Click to change image
            </p>
            <p className="text-center text-xs text-white/80 drop-shadow-sm">
              Uploads instantly to Cloudinary & updates store
            </p>
          </div>
        )}

        {/* Uploading State Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-4 text-white backdrop-blur-sm">
            <Loader2 size={36} className="animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-semibold">Uploading to Cloudinary...</p>
              <p className="text-xs text-white/80">Saving URL to MongoDB database</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BannerManager({ initialBanners = {} }) {
  const router = useRouter();
  const [banners, setBanners] = useState(initialBanners);

  const handleImageUpdated = (key, newUrl) => {
    setBanners((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        imageUrl: newUrl,
      },
    }));
    router.refresh();
  };

  const heroBanner = banners.hero_banner || {
    key: 'hero_banner',
    type: 'banner',
    title: 'Hero Banner',
    subtitle: 'Main banner at the top of the homepage (16:9 aspect ratio)',
    imageUrl: 'https://res.cloudinary.com/wqfqifcs/image/upload/v1792880713/banners/hero_banner.webp',
    link: '/',
  };

  const catRetro = banners.cat_manufactured_retro || {
    key: 'cat_manufactured_retro',
    type: 'category',
    title: 'Manufactured Retro',
    categoryHeading: 'Category: Manufactured Retro',
    subtitle: 'First category banner on homepage, links to retro collection',
    imageUrl: 'https://res.cloudinary.com/wqfqifcs/image/upload/v1792880714/banners/cat_manufactured_retro.webp',
    link: '/shop?category=manufactured-retro',
  };

  const catPlayer = banners.cat_player_edition || {
    key: 'cat_player_edition',
    type: 'category',
    title: 'Player Edition',
    categoryHeading: 'Category: Player Edition',
    subtitle: 'Second category banner on homepage, links to player edition jerseys',
    imageUrl: 'https://res.cloudinary.com/wqfqifcs/image/upload/v1792880715/banners/cat_player_edition.webp',
    link: '/shop?category=player-edition',
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Banner & Category Images
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            router.refresh();
            toast.success('Refreshed images from database');
          }}
          className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-semibold text-text shadow-sm transition-all hover:bg-surface active:scale-95 sm:self-center"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Section 1: Hero Banner */}
      <section className="space-y-3">
        <div className="border-b border-border/60 pb-2">
          <h2 className="text-base font-bold uppercase tracking-wider text-text-muted">
            1. Banner Image
          </h2>
        </div>

        <BannerCard
          bannerKey={heroBanner.key || 'hero_banner'}
          title={heroBanner.title || 'Hero Banner'}
          subtitle="Main full-width banner on the homepage. Click the image to replace it."
          categoryHeading="Hero Banner"
          type="banner"
          aspectRatio="aspect-[16/9] md:aspect-[21/9]"
          currentUrl={heroBanner.imageUrl}
          link="/"
          onImageUpdated={handleImageUpdated}
        />
      </section>

      {/* Section 2: Category Images */}
      <section className="space-y-4">
        <div className="border-b border-border/60 pb-2">
          <h2 className="text-base font-bold uppercase tracking-wider text-text-muted">
            2. Category Images
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Category 1: Manufactured Retro */}
          <BannerCard
            bannerKey={catRetro.key || 'cat_manufactured_retro'}
            title={catRetro.title || 'Manufactured Retro'}
            categoryHeading="Category: Manufactured Retro"
            subtitle="Links to /shop?category=manufactured-retro"
            type="category"
            aspectRatio="aspect-[1080/438]"
            currentUrl={catRetro.imageUrl}
            link="/shop?category=manufactured-retro"
            onImageUpdated={handleImageUpdated}
          />

          {/* Category 2: Player Edition */}
          <BannerCard
            bannerKey={catPlayer.key || 'cat_player_edition'}
            title={catPlayer.title || 'Player Edition'}
            categoryHeading="Category: Player Edition"
            subtitle="Links to /shop?category=player-edition"
            type="category"
            aspectRatio="aspect-[1080/429]"
            currentUrl={catPlayer.imageUrl}
            link="/shop?category=player-edition"
            onImageUpdated={handleImageUpdated}
          />
        </div>
      </section>
    </div>
  );
}
