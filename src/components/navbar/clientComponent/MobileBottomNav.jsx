'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUser, House, ShoppingBasket, ShoppingCart } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: House, label: 'Home' },
  { href: '/shop', icon: ShoppingCart, label: 'Shop' },
  { href: '/cart', icon: ShoppingBasket, label: 'Cart' },
  { href: '/account', icon: CircleUser, label: 'Account' },
];

const MobileBottomNav = () => {
  const pathname = usePathname();

  const activeIndex = NAV_ITEMS.findIndex((item) => item.href === pathname);
  const safeIndex = activeIndex !== -1 ? activeIndex : 0;

  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger squish/stretch animation on tab change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 450);
    return () => clearTimeout(timer);
  }, [safeIndex]);

  return (
    <nav className="mobile-nav relative w-[85%] rounded-full border border-white/20 bg-primary/80 p-1.5 shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,0.9),inset_0_-8px_8px_-8px_rgba(255,255,255,0.9)] backdrop-blur-sm">
      {/* KEYFRAME ANIMATIONS FOR JELLY SQUASH & STRETCH */}
      <style jsx>{`
        @keyframes jellyMorph {
          0% {
            transform: translateX(${safeIndex * 100}%) scaleX(1) scaleY(1);
          }
          35% {
            transform: translateX(${safeIndex * 100}%) scaleX(1.18) scaleY(0.82);
          }
          70% {
            transform: translateX(${safeIndex * 100}%) scaleX(0.92) scaleY(1.08);
          }
          100% {
            transform: translateX(${safeIndex * 100}%) scaleX(1) scaleY(1);
          }
        }
        .animate-jelly {
          animation: jellyMorph 450ms cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }
      `}</style>

      <ul className="relative flex flex-row items-center justify-between">
        {/* SLIDING SQUASH-AND-STRETCH PILL */}
        <div
          aria-hidden="true"
          className={`absolute bottom-0 top-0 z-10 my-auto h-[calc(100%-2px)] rounded-3xl bg-accent shadow-md transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)] ${
            isAnimating ? 'animate-jelly' : ''
          }`}
          style={{
            width: `${100 / NAV_ITEMS.length}%`,
            transform: `translateX(${safeIndex * 100}%)`,
            willChange: 'transform',
          }}
        />

        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isActive = safeIndex === index;

          return (
            <li key={item.href} className="relative z-20 flex-1">
              <Link
                href={item.href}
                className="relative flex items-center justify-center py-2.5 transition-transform active:scale-90"
              >
                <Icon
                  size={26}
                  className={`text-white transition-all duration-300 ease-out ${
                    isActive
                      ? 'scale-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;