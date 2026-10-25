'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCartUI } from './CartUIContext';

const SideCart = dynamic(() => import('./SideCart'), { ssr: false });

export default function CartDrawer() {
  const { isCartOpen, closeCart } = useCartUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isCartOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 520);
      return () => clearTimeout(timer);
    }
  }, [isCartOpen]);

  if (!mounted && !isCartOpen) return null;

  return <SideCart open={isCartOpen} onClose={closeCart} />;
}