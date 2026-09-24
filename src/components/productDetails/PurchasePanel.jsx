'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBasket, Zap } from 'lucide-react';
import { addToCart } from '@/components/sideCart/SideCart';
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
    patch: '',
  });

  const stock = Number(product.stock) || 0;
  const isOutOfStock = stock <= 0;
  const requiresSize = Array.isArray(product.size) && product.size.length > 0;

  // The cart (SideCart.jsx) expects `name` / `image`; your document has
  // `title` / `imagesLink[]` — mapped here once rather than changing either
  // shape to match the other.
  const cartItem = useMemo(
    () => ({
      id: product._id ?? slug,
      slug,
      name: product.title,
      price: product.price,
      originalPrice: product.discount ? product.beforePrice : undefined,
      image: product.imagesLink?.[0],
      customization: customization.fontEnabled
        ? { name: customization.name, number: customization.number }
        : undefined,
      patch: customization.patch || undefined,
    }),
    [customization, product, slug]
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
      <SizeSelector
        sizes={product.size}
        selectedSize={selectedSize}
        onSelect={handleSelectSize}
        onOpenSizeChart={() => setSizeChartOpen(true)}
      />
      <CustomizationOptions
        font={product.font}
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