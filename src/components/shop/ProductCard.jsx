'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Heart, QrCode, ShoppingBasket } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import ProductQrModal from './ProductQrModal';
import AddToCartFlyClone from './AddToCartFlyClone';
// import ProductImage from '../../../public/products/1.jpg';
import { addToCart } from '../sideCart/SideCart';

// SideCartButton.jsx carries this as a data attribute. Looked up fresh at
// click time rather than via a ref/context, since this card can render far
// from the navbar in the tree and a one-off target lookup doesn't need more.
const CART_TARGET_SELECTOR = '[data-cart-fly-target]';
const ADDED_FEEDBACK_MS = 1400;

export default function ProductCard({
  product,
  priority = false,
  index = 0,
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [flight, setFlight] = useState(null); // { from, to } | null
  const [justAdded, setJustAdded] = useState(false);

  const imageBoxRef = useRef(null);
  const addedTimerRef = useRef(null);

  const { name, price, originalPrice, discountPercent, isNew, stamp, image, slug } = product || {};

  // Belt-and-braces: locks the page while the clone is mid-flight. The
  // real reason it can't drift is that the target is a `sticky top-0`
  // nav icon (see SideCartButton), so its viewport position never moves
  // under scroll the way GalleryFlyClone's in-flow target did.
  useEffect(() => {
    if (!flight) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [flight]);

  useEffect(() => () => {
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
  }, []);

  function markAdded() {
    setJustAdded(true);
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    addedTimerRef.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  }

  function handleAddToCart() {
    const imageEl = imageBoxRef.current;
    const sourceImage = imageEl?.querySelector('img');
    const targetEl = document.querySelector(CART_TARGET_SELECTOR);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!imageEl || !targetEl || reduceMotion || !sourceImage?.complete || !sourceImage.naturalWidth) {
      if (!targetEl && process.env.NODE_ENV !== 'production') {
        // If you see this in the console, SideCartButton.jsx is missing its
        // data-cart-fly-target attribute (or hasn't mounted yet).
        console.warn('[ProductCard] No [data-cart-fly-target] element found — the fly animation is being skipped.');
      }
      addToCart(product, 1);
      markAdded();
      return;
    }

    setFlight({
      src: sourceImage.currentSrc || image,
      from: imageEl.getBoundingClientRect(),
      to: targetEl.getBoundingClientRect(),
    });
  }

  function handleFlightDone() {
    setFlight(null);
    addToCart(product, 1);
    markAdded();
  }

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
          <Link href={`/shop/product/${slug}`} className="block">
            <div ref={imageBoxRef} className="relative aspect-square overflow-hidden bg-white">
              <Image
                src={image}
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
              onClick={handleAddToCart}
              disabled={Boolean(flight)}
              aria-label={justAdded ? 'Added to cart' : 'Add to cart'}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 disabled:pointer-events-none disabled:opacity-70 md:h-9 md:w-9 ${
                justAdded
                  ? 'border-success/40 bg-success text-white'
                  : 'border-white/20 bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <span
                key={justAdded ? 'check' : 'basket'}
                className="flex animate-[cart-badge-pop_0.3s_cubic-bezier(0.34,1.56,0.64,1)_both]"
              >
                {justAdded ? (
                  <Check size={15} strokeWidth={2.2} />
                ) : (
                  <ShoppingBasket size={15} strokeWidth={1.8} />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* PRODUCT INFORMATION */}
        <Link
          href={`/shop/product/${slug}`}
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

      {flight &&
        createPortal(
          <AddToCartFlyClone
            src={flight.src}
            from={flight.from}
            to={flight.to}
            onDone={handleFlightDone}
          />,
          document.body
        )}
    </>
  );
}