'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export default function SideCartProducts({
  item,
  index,
  onQuantityChange,
  onRemove,
}) {
  const hasDiscount =
    item.originalPrice &&
    item.originalPrice > item.price;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((item.originalPrice - item.price) /
          item.originalPrice) *
          100
      )
    : 0;

  const increaseQuantity = () => {
    onQuantityChange(item.quantity + 1);
  };

  const decreaseQuantity = () => {
    onQuantityChange(item.quantity - 1);
  };

  return (
    <article
      className="
        group
        relative
        flex gap-3
        rounded-2xl
        border border-border/80
        bg-white
        p-2.5
        transition-all
        duration-200
        hover:border-primary/25
        hover:shadow-[0_6px_20px_-12px_rgba(32,36,38,0.3)]
      "
    >
      {/* =====================================================
          PRODUCT IMAGE
      ===================================================== */}

      <div
        className="
          relative
          h-23 w-23
          shrink-0
          overflow-hidden
          rounded-xl
          bg-surface
          sm:h-24 sm:w-24
        "
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className="
              object-cover
              transition-transform
              duration-500
              ease-out
              group-hover:scale-[1.04]
            "
          />
        ) : (
          <div
            className="
              flex h-full w-full
              items-center justify-center
              text-xs
              text-text-muted
            "
          >
            No image
          </div>
        )}

        {/* Discount badge */}

        {hasDiscount && (
          <span
            className="
              absolute
              left-1.5 top-1.5
              rounded-md
              bg-white/95
              px-1.5 py-0.5
              text-[10px]
              font-bold
              text-primary
              shadow-sm
              backdrop-blur-sm
            "
          >
            -{discountPercentage}%
          </span>
        )}
      </div>

      {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

      <div
        className="
          min-w-0
          flex-1
          py-0.5
          pr-7
        "
      >
        {/* Product name */}

        <h3
          className="
            line-clamp-2
            text-[13px]
            font-semibold
            leading-[1.35]
            tracking-[-0.005em]
            text-text
            transition-colors
            duration-200
            group-hover:text-primary-dark
          "
        >
          {item.name}
        </h3>

        {/* Size */}

        {item.size && (
          <p
            className="
              mt-1
              text-[11px]
              font-medium
              text-text-muted
            "
          >
            Size:{' '}
            <span className="text-text">
              {item.size}
            </span>
          </p>
        )}

        {/* Price */}

        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="
              text-sm
              font-semibold
              text-primary-dark
            "
          >
            {formatPrice(item.price)}৳
          </span>

          {hasDiscount && (
            <span
              className="
                text-[11px]
                text-text-muted
                line-through
              "
            >
              {formatPrice(item.originalPrice)}৳
            </span>
          )}
        </div>

        {/* =================================================
            QUANTITY CONTROL
        ================================================= */}

        <div className="mt-2.5">
          <div
            className="
              inline-flex
              h-8
              items-center
              rounded-lg
              border border-border
              bg-surface
              overflow-hidden
            "
          >
            <button
              type="button"
              onClick={decreaseQuantity}
              aria-label={`Decrease quantity of ${item.name}`}
              className="
                flex h-full w-8
                cursor-pointer
                items-center justify-center
                text-text-muted
                transition-all
                duration-150
                hover:bg-primary-soft
                hover:text-primary-dark
                active:scale-90
              "
            >
              <Minus size={13} strokeWidth={2} />
            </button>

            <span
              aria-label={`Quantity: ${item.quantity}`}
              className="
                flex h-full
                min-w-7
                items-center
                justify-center
                border-x border-border
                bg-white
                px-1
                text-xs
                font-semibold
                tabular-nums
                text-text
              "
            >
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              aria-label={`Increase quantity of ${item.name}`}
              className="
                flex h-full w-8
                cursor-pointer
                items-center justify-center
                text-text-muted
                transition-all
                duration-150
                hover:bg-primary-soft
                hover:text-primary-dark
                active:scale-90
              "
            >
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          REMOVE BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.name} from cart`}
        className="
          absolute
          right-2.5 top-2.5
          flex h-7 w-7
          cursor-pointer
          items-center justify-center
          rounded-lg
          text-text-muted/70
          opacity-100
          transition-all
          duration-200
          hover:bg-danger/8
          hover:text-danger
          active:scale-90
          sm:opacity-0
          sm:group-hover:opacity-100
          focus-visible:opacity-100
        "
      >
        <Trash2
          size={14}
          strokeWidth={1.8}
        />
      </button>

      {/* =====================================================
          ITEM TOTAL
      ===================================================== */}

      <div
        className="
          absolute
          bottom-3
          right-3
          hidden
          text-[11px]
          font-medium
          text-text-muted
          sm:block
        "
      >
        {formatPrice(item.price * item.quantity)}৳
      </div>
    </article>
  );
}
