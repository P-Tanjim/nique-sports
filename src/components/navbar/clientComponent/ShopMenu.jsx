'use client'
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ShopMenu({ shopItems }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <li className="relative group/shop">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 py-5 hover:text-primary transition-colors duration-300"
      >
        Shop
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="transition-transform duration-300 group-hover/shop:rotate-180"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <div
        className={`
          invisible opacity-0 scale-50 origin-top
          group-hover/shop:visible group-hover/shop:opacity-100 group-hover/shop:scale-100
          absolute left-1/2 -translate-x-1/2 top-full
          pt-3
          transition-all duration-200
        `}
      >
        <div
          onMouseLeave={() => setHoveredIndex(null)}
          className={`
            w-64
            rounded-[24px]
            border border-white/10
            bg-primary-dark/70
            backdrop-blur-sm
            shadow-2xl
            p-2
          `}
        >
          {shopItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredIndex(index)}
              className="relative flex items-center px-4 py-3 text-sm font-medium text-white group/item"
            >
              {/* Floating iOS Indicator Pill */}
              {hoveredIndex === index && (
                <motion.div
                  layoutId="ios-pill"
                  className="absolute inset-0 bg-white/15 border border-white/20 rounded-2xl shadow-inner"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <span className="relative z-10 transition-transform duration-200 group-hover/item:translate-x-1">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
}