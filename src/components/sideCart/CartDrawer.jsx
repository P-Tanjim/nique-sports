'use client';

import SideCart from './SideCart';
import { useCartUI } from './CartUIContext';

export default function CartDrawer() {
  const { isCartOpen, closeCart } = useCartUI();
  return <SideCart open={isCartOpen} onClose={closeCart} />;
}