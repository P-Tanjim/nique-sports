'use client'
import { useCartUI } from "@/components/sideCart/CartUIContext";
import { ShoppingBasket } from "lucide-react";

export default function SideCartButton() {
    const { openCart } = useCartUI();
    return (
        <button
          className="backdrop-blur-sm shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.2),inset_0_-8px_8px_-8px_rgba(0,0,0,0.2)] lg:shadow h-11 w-11 flex items-center justify-center text-primary-light hover:text-primary rounded-full cursor-pointer transition-colors z-10"
          onClick={openCart}
        >
          <ShoppingBasket size={20} />
        </button>
    )
}