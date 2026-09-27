'use client'
import { useCartUI } from "@/components/sideCart/CartUIContext";
import { useCartCount } from "@/components/sideCart/SideCart";
import { ShoppingBasket } from "lucide-react";

export default function SideCartButton() {
    const { openCart } = useCartUI();
    const count = useCartCount();
    const hasItems = count > 0;

    return (
        <button
          type="button"
          data-cart-fly-target
          onClick={openCart}
          aria-label="Open cart"
          className={`relative backdrop-blur-sm h-11 w-11 flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 z-10 shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.2),inset_0_-8px_8px_-8px_rgba(0,0,0,0.2)] lg:shadow text-primary-light hover:text-primary`}
        >
          <ShoppingBasket size={20} />
          {hasItems && (
            <span
              key={count}
              className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full text-[10px] bg-linear-to-br from-primary to-primary-light text-white shadow-[0_10px_24px_-8px_rgba(48,136,152,0.55)] animate-[cart-badge-pop_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]"
            >
              {count}
            </span>
          )}
        </button>
    )
}