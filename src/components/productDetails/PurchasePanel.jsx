'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBasket, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { addToCart } from '@/components/sideCart/SideCart';
import { formatPrice } from '@/lib/format';
import SizeSelector from './SizeSelector';
import SizeChartModal from './SizeChartModal';
import CustomizationOptions from './CustomizationOptions';

// Client Component — this is where all the "what is the person about to
// buy" state lives: selected size, quantity, and the two purchase actions.
// Kept as one component (rather than giving SizeSelector its own state)
// because Add to Cart / Buy Now both need to read the selected size to
// validate before doing anything.
export default function PurchasePanel({ product, slug }) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [customization, setCustomization] = useState({
    fontEnabled: false,
    name: '',
    number: '',
    font: '',
    patch: '',
  });

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;
  const requiresSize = Array.isArray(product.size) && product.size.length > 0;
  const basePrice = Number(product.price) || 0;
  const fontPrice = customization.fontEnabled ? Number(customization.font?.price) || 0 : 0;
  const patchPrice = Number(customization.patch?.price) || 0;
  const selectedOptionsPrice = fontPrice + patchPrice;
  const totalPrice = basePrice + selectedOptionsPrice;
  const hasSelectedOptions = Boolean(
    (customization.fontEnabled && customization.font) || customization.patch
  );
  const originalPrice = product.discount && Number(product.beforePrice) > basePrice
    ? Number(product.beforePrice) + selectedOptionsPrice
    : null;

  // The cart (SideCart.jsx) expects `name` / `image`; your document has
  // `title` / `imagesLink[]` — mapped here once rather than changing either
  // shape to match the other.
  const cartItem = useMemo(
    () => ({
      id: product._id ?? slug,
      slug,
      name: product.title,
      basePrice,
      price: totalPrice,
      originalPrice: originalPrice ?? undefined,
      image: product.imagesLink?.[0],
      customization: customization.fontEnabled
        ? {
            name: customization.name,
            number: customization.number,
            font: customization.font || undefined,
          }
        : undefined,
      patch: customization.patch || undefined,
    }),
    [basePrice, customization, originalPrice, product, slug, totalPrice]
  );

  function handleSelectSize(size) {
    setSelectedSize(size);
    setSizeError(false);
  }

  function validate() {
    if (requiresSize && !selectedSize) {
      setSizeError(true);
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!validate()) return;
    addToCart(cartItem, quantity, selectedSize);
  }

  function handleBuyNow() {
    if (!validate()) return;
    addToCart(cartItem, quantity, selectedSize);
    router.push('/checkout');
  }

  return (
    <div className="mt-6 space-y-5">
      <motion.div
        layout
        transition={{ layout: { type: 'spring', stiffness: 520, damping: 42 } }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-2xl font-bold text-text sm:text-3xl">
            {formatPrice(totalPrice)}৳
          </span>
          {originalPrice && (
            <>
              <span className="text-base text-text-muted line-through">
                {formatPrice(originalPrice)}৳
              </span>
              <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">
                -{Math.round(((Number(product.beforePrice) - basePrice) / Number(product.beforePrice)) * 100)}%
              </span>
            </>
          )}
        </div>
        <AnimatePresence initial={false}>
          {hasSelectedOptions && (
            <motion.p
              initial={{ height: 0, opacity: 0, y: -4 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -4 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden pt-1 text-xs font-medium text-text-muted"
            >
              <span className="inline-flex flex-wrap items-center gap-x-1.5">
                <span>Product {formatPrice(basePrice)}৳</span>
                {customization.fontEnabled && customization.font && (
                  <span>+ Font {formatPrice(fontPrice)}৳</span>
                )}
                {customization.patch && (
                  <span>+ Patch {formatPrice(patchPrice)}৳</span>
                )}
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
      <SizeSelector
        sizes={product.size}
        selectedSize={selectedSize}
        onSelect={handleSelectSize}
        onOpenSizeChart={() => setSizeChartOpen(true)}
      />
      <CustomizationOptions
        font={product.font}
        fontImages={product.font ? product.fontsImg : []}
        patches={product.patch ? product.patchsImg : []}
        onChange={setCustomization}
      />
      {sizeError && (
        <p className="-mt-3 text-xs font-medium text-danger">Please select a size first.</p>
      )}

      <div>
        <span className="text-sm font-semibold text-text mr-2">Quantity</span>
        <div className="mt-2 inline-flex h-11 items-center overflow-hidden rounded-xl border border-border bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-full w-11 cursor-pointer items-center justify-center text-text-muted transition-colors enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus size={14} />
          </button>
          <span className="flex h-full w-12 items-center justify-center border-x border-border text-sm font-semibold text-text">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={isOutOfStock || quantity >= stock}
            aria-label="Increase quantity"
            className="flex h-full w-11 cursor-pointer items-center justify-center text-text-muted transition-colors enabled:hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex cursor-pointer p-3 md:h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-primary bg-white text-sm font-semibold text-primary transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:border-border disabled:text-text-muted disabled:hover:bg-white"
        >
          <ShoppingBasket size={17} />
          Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex cursor-pointer p-3 md:h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-[0_10px_25px_-8px_rgba(48,136,152,0.5)] transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-border disabled:shadow-none"
        >
          <Zap size={17} />
          Buy Now
        </button>
      </div>

      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
    </div>
  );
}