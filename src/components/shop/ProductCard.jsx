'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, QrCode, ShoppingBasket } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import ProductQrModal from './ProductQrModal';
import ProductImage from '../../../public/products/1.jpg';

export default function ProductCard({
  product,
  priority = false,
  index = 0,
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const {
    name,
    price,
    originalPrice,
    discountPercent,
    isNew,
    stamp,
    image,
    slug,
  } = product || {};

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{
          duration: 0.3,
          delay: Math.min(index, 8) * 0.03,
          ease: 'easeOut',
        }}
        className="group relative overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_8px_rgba(32,36,38,0.05)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(32,36,38,0.12)]"
      >
        {/* BADGES */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-white md:px-2.5 md:py-1 md:text-[10px]">
              -{discountPercent}%
            </span>
          )}

          {isNew && (
            <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[8px] font-semibold tracking-wide text-primary-dark md:px-2.5 md:py-1 md:text-[10px]">
              NEW
            </span>
          )}
        </div>

        {/* QR MODAL TRIGGER */}
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          aria-label={`View QR code for ${name}`}
          className="absolute right-3 top-3 cursor-pointer z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/70 md:h-9 md:w-9"
        >
          <QrCode size={14} strokeWidth={1.8} />
        </button>

        {/* PRODUCT IMAGE */}
        <div className="relative">
          <Link href={`/product/${slug}`} className="block">
            <div className="relative aspect-square overflow-hidden bg-white">
              <Image
                src={ProductImage}
                alt={name || 'Product Image'}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                unoptimized={image?.startsWith('data:')}
                onLoad={() => setLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035] ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </Link>

          {/* STAMP */}
          {stamp && (
            <span className="pointer-events-none absolute bottom-3 left-3 z-20 flex h-14 w-14 -rotate-12 items-center justify-center rounded-full border-2 border-danger/70 bg-white/85 text-center text-[9px] font-bold uppercase leading-tight text-danger shadow-sm backdrop-blur-sm">
              {stamp}
            </span>
          )}

          {/* ACTION BUTTONS */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2 opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">
            {/* Wishlist */}
            <button
              type="button"
              onClick={() => setWishlisted((value) => !value)}
              aria-pressed={wishlisted}
              aria-label={
                wishlisted ? 'Remove from wishlist' : 'Add to wishlist'
              }
              className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-110 md:h-9 md:w-9 ${
                wishlisted
                  ? 'border-danger/40 bg-white/90 text-danger shadow-sm'
                  : 'border-white/20 bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Heart
                size={15}
                strokeWidth={1.8}
                fill={wishlisted ? 'currentColor' : 'none'}
              />
            </button>

            {/* Cart - Shopping Basket */}
            <button
              type="button"
              aria-label="Add to cart"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-black/70 md:h-9 md:w-9"
            >
              <ShoppingBasket size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* PRODUCT INFORMATION */}
        <Link
          href={`/product/${slug}`}
          className="block border-t border-border/60 bg-white px-4 py-3 transition-colors duration-300 group-hover:bg-surface"
        >
          <h3 className="line-clamp-2 text-sm font-medium leading-relaxed tracking-[-0.01em] text-text">
            {name}
          </h3>

          <div className="mt-2 flex items-baseline gap-2">
            {originalPrice && (
              <span className="text-xs text-text-muted line-through">
                {formatPrice(originalPrice)}৳
              </span>
            )}

            <span className="text-base font-semibold text-text">
              {formatPrice(price)}৳
            </span>
          </div>
        </Link>
      </motion.div>

      <ProductQrModal
        product={product}
        open={qrOpen}
        onClose={() => setQrOpen(false)}
      />
    </>
  );
}