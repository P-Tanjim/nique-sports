'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Heart, QrCode, ShoppingBasket } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import dynamic from 'next/dynamic';

const ProductQrModal = dynamic(() => import('./ProductQrModal'), { ssr: false });
import AddToCartFlyClone from './AddToCartFlyClone';
import ImageWithLoader from '@/components/common/ImageWithLoader';
// import ProductImage from '../../../public/products/1.jpg';
import { addToCart } from '@/lib/cartStore';

// SideCartButton.jsx carries this as a data attribute. Looked up fresh at
// click time rather than via a ref/context, since this card can render far
// from the navbar in the tree and a one-off target lookup doesn't need more.
const CART_TARGET_SELECTOR = '[data-cart-fly-target]';
const ADDED_FEEDBACK_MS = 1400;

export default function ProductCard({
  product,
  eager = false,
  priority = false,
  index = 0,
}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [flight, setFlight] = useState(null); // { from, to } | null
  const [justAdded, setJustAdded] = useState(false);

  const imageBoxRef = useRef(null);
  const addedTimerRef = useRef(null);

  const { name, price, originalPrice, discountPercent, isNew, stamp, image, slug } = product || {};
  const imageSrc = image || product?.imagesLink?.[0] || product?.image;

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

    // Provide instant visual confirmation on the button while flying thumbnail
    markAdded();
    setFlight({
      src: sourceImage.currentSrc || image,
      from: imageEl.getBoundingClientRect(),
      to: targetEl.getBoundingClientRect(),
    });
  }

  function handleFlightDone() {
    setFlight(null);
    addToCart(product, 1);
  }

  return (
    <>
      <div
        className="product-card-enter card-gpu-isolate h-full"
        style={{ '--card-i': Math.min(index, 11) }}
      >
        <div
          className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-white shadow-[0_2px_8px_rgba(32,36,38,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:border-primary/30 hover:shadow-[0_20px_45px_rgba(32,36,38,0.12)]"
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
            className="absolute right-3 top-3 cursor-pointer z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-sm bg-linear-to-t from-black/70 via-black/65 to-black/40 md:bg-black/45 md:backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:bg-black/70 md:h-9 md:w-9"
          >
            <QrCode size={14} strokeWidth={1.8} />
          </button>

          {/* PRODUCT IMAGE */}
          <div className="relative">
            <Link href={`/shop/product/${slug}`} className="block">
              <div ref={imageBoxRef} className="relative aspect-square overflow-hidden bg-white">
                <ImageWithLoader
                  src={imageSrc}
                  alt={name || 'Product Image'}
                  fill
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
                  quality={85}
                  priority={priority || eager}
                  fetchPriority={priority || eager ? 'high' : 'auto'}
                  loading={priority || eager ? 'eager' : 'lazy'}
                  unoptimized={typeof imageSrc === 'string' && imageSrc.startsWith('data:')}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]"
                  containerClassName="relative h-full w-full"
                />
              </div>
            </Link>

            {/* STAMP */}
            {stamp && (
              <span className="pointer-events-none absolute bottom-3 left-3 z-20 flex h-14 w-14 -rotate-12 items-center justify-center rounded-full border-2 border-danger/70 bg-white/85 text-center text-[9px] font-bold uppercase leading-tight text-danger shadow-sm">
                {stamp}
              </span>
            )}

            {/* ACTION BUTTONS */}
            <div className="absolute bottom-2 w-full z-20 flex justify-center items-center flex-col gap-2 opacity-100 transition-all duration-300 ease-out lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0">

              {/* Cart - Shopping Basket */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={Boolean(flight) || justAdded}
                aria-label={justAdded ? 'Added to cart' : 'Add to cart'}
                className={`group/btn relative flex h-7 w-[85%] cursor-pointer items-center justify-center overflow-hidden rounded-md border shadow-sm backdrop-blur-sm transition-all duration-200 ease-out hover:scale-105 active:scale-95 disabled:pointer-events-none md:h-9 ${
                  justAdded
                    ? 'border-success/50 bg-success text-white shadow-md shadow-success/20'
                    : 'border-white/20 bg-black/35 text-white hover:bg-black/60 hover:border-white/40 hover:shadow-md'
                }`}
              >
                <span
                  key={justAdded ? 'check' : 'basket'}
                  className="flex items-center justify-center gap-1.5 transition-transform duration-200 animate-[cart-badge-pop_0.25s_cubic-bezier(0.34,1.56,0.64,1)_both]"
                >
                  {justAdded ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide md:text-xs">
                      <Check size={14} strokeWidth={2.5} className="shrink-0" />
                      <span>Added</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5 text-[10px] font-medium tracking-wide md:text-xs">
                      <span>Add to Cart</span>
                      <ShoppingBasket
                        size={14}
                        strokeWidth={1.8}
                        className="shrink-0 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-rotate-6"
                      />
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* PRODUCT INFORMATION */}
          <Link
            href={`/shop/product/${slug}`}
            className="block flex-1 border-t border-border/60 bg-white px-4 py-3 transition-colors duration-300 group-hover:bg-surface"
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
        </div>
      </div>

      {qrOpen && (
        <ProductQrModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          product={product}
        />
      )}

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