"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShoppingBag, Heart } from "lucide-react";

const products = [
  {
    id: 1,
    title: "Borussia Dortmund Home",
    image: "/featuredProduct/1.jpg",
    originalPrice: "১,২৮০",
    price: "১,১৫০",
    discount: "-10%",
    isNew: true,
  },
  {
    id: 2,
    title: "Brazil Yellow Sports Cap",
    image: "/featuredProduct/2.jpg",
    originalPrice: "১,২৫০",
    price: "৯৫০",
    discount: "-24%",
    isNew: false,
  },
  {
    id: 3,
    title: "FC Barcelona 2026/27 Away Jersey",
    image: "/featuredProduct/3.jpg",
    originalPrice: "১,৪৫০",
    price: "১,১৫০",
    discount: "-20%",
    isNew: true,
  },
  {
    id: 4,
    title: "Manchester City Home Kit 2026/27",
    image: "/featuredProduct/4.jpg",
    originalPrice: "১,১০০",
    price: "৮৫০",
    discount: "-22%",
    isNew: false,
  },
  {
    id: 5,
    title: "Arsenal 26/27 Home Jersey",
    image: "/featuredProduct/5.jpg",
    originalPrice: "১,২০০",
    price: "৯০০",
    discount: "-25%",
    isNew: true,
  },
  {
    id: 6,
    title: "Real Madrid 2017/18 Blue Edition",
    image: "/featuredProduct/6.jpg",
    originalPrice: "১,১৫০",
    price: "৮৯৯",
    discount: "-21%",
    isNew: false,
  },
];

const ProductCard = ({ product }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="group relative w-full bg-[#f4f5f7] dark:bg-neutral-900 border border-black/5 dark:border-white/10 rounded-2xl p-1.5 shadow-xs hover:shadow-lg transition-all duration-300">
      {/* Top Image Container */}
      <div className="relative w-full aspect-square bg-white dark:bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top-Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.discount && (
            <span className="bg-[#1e2328] text-white text-[9px] font-bold px-1.5 py-1 rounded-full tracking-wide shadow-[9px]">
              {product.discount}
            </span>
          )}
          {product.isNew && (
            <span className="bg-[#1e2328] text-white text-[8px] font-bold px-2 py-1 rounded-full tracking-wide shadow-[9px]">
              NEW
            </span>
          )}
        </div>

        {/* Floating Action Pill Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2 py-1 rounded-full shadow-md flex items-center gap-2 z-10 transition-transform duration-300 group-hover:scale-105">
          <button
            aria-label="Add to Cart"
            className="text-neutral-800 dark:text-neutral-200 hover:text-primary transition-colors cursor-pointer"
          >
            <ShoppingBag size={12} strokeWidth={2.2} />
          </button>
          <div className="w-[1.5px] h-4 bg-neutral-200 dark:bg-neutral-700" />
          <button
            aria-label="Wishlist"
            onClick={() => setLiked(!liked)}
            className={`transition-colors cursor-pointer ${
              liked ? "text-red-500 fill-red-500" : "text-neutral-800 dark:text-neutral-200 hover:text-red-500"
            }`}
          >
            <Heart size={12} strokeWidth={2.2} className={liked ? "fill-current" : ""} />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="px-2 pt-4 pb-2 flex flex-col items-center text-center gap-1.5">
        <h3 className="text-[#1e2328] dark:text-white font-bold text-base md:text-lg line-clamp-2 leading-tight">
          {product.title}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          {product.originalPrice && (
            <span className="text-neutral-400 text-sm font-normal line-through">
              {product.originalPrice}৳
            </span>
          )}
          <span className="text-black dark:text-white text-lg md:text-xl font-extrabold">
            {product.price}৳
          </span>
        </div>
      </div>
    </div>
  );
};

export default function TestProductSection() {
  return (
    <section className="w-full mx-auto md:px-8 py-10">
      <h2 className="text-2xl md:text-4xl font-extrabold text-center text-neutral-900 dark:text-white mb-8">
        Featured Collection
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}