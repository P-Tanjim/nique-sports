'use client'
import Image from 'next/image'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Scan, ShoppingBasket, X } from 'lucide-react'
import { addToCart } from '@/components/sideCart/SideCart';

const TRANSITION_MS = 400;

const ProductCard = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const mountedRef = useRef(false);
    const closeTimerRef = useRef(null);

    const open = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsOpen(true);

        if (mountedRef.current) {
            setVisible(true);
            return;
        }

        mountedRef.current = true;
        setMounted(true);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setVisible(true));
        });
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setVisible(false);
        closeTimerRef.current = setTimeout(() => {
            mountedRef.current = false;
            setMounted(false);
        }, TRANSITION_MS);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (e) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [mounted, close]);

    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }, []);

    const imageAlt = product?.title ? `${product.title} - front view merchandise` : 'Sports jersey merchandise';

    return (
        <>
            {/* 
              CARD DESIGN 
              Mobile: Minimalist info bar below image with always-visible square 'Add' button.
              Desktop: Editorial layout with hover-reveal action block.
            */}
            <div className="group relative w-full">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f4f4f4] cursor-pointer md:cursor-default" onClick={(e) => {
                    // On mobile, tapping the image opens the Quick View
                    if (window.innerWidth < 768) open();
                }}>
                    <Image
                        src={product.image}
                        alt={imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] md:group-hover:scale-105"
                    />
                    
                    {/* MOBILE ONLY: Quick View Hint (Floating Top Right) */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); open(); }}
                        aria-label="Quick view"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-white/90 backdrop-blur shadow-sm md:hidden"
                    >
                        <Scan size={14} strokeWidth={2} />
                    </button>

                    {/* DESKTOP ONLY: Hover Action Block */}
                    <div className="hidden md:flex absolute inset-x-0 bottom-0 translate-y-full flex-col bg-white/90 p-3 backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); open(); }}
                                className="flex h-11 flex-1 items-center justify-center gap-2 border border-black bg-transparent text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                            >
                                <Scan size={16} strokeWidth={1.5} />
                                View
                            </button>
                            <button
                                type="button"
                                onClick={() => addToCart(product, 1, 'XL')}
                                className="flex h-11 flex-1 items-center justify-center gap-2 bg-black text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-neutral-800"
                            >
                                <ShoppingBasket size={16} strokeWidth={1.5} />
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Block */}
                <div className="mt-3 flex items-start justify-between md:mt-4 md:block md:text-center">
                    <div className="flex flex-col pr-2 md:pr-0">
                        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-neutral-900 line-clamp-2 md:line-clamp-1 md:tracking-[0.15em]">
                            {product.title}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-neutral-500 md:mt-1.5">
                            {product.price} <span className="font-sans text-xs">৳</span>
                        </p>
                    </div>
                    
                    {/* MOBILE ONLY: Quick Add Square Button */}
                    <button
                        type="button"
                        onClick={() => addToCart(product, 1, 'XL')}
                        aria-label="Add to cart"
                        className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white active:bg-neutral-800 md:hidden"
                    >
                        <ShoppingBasket size={18} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* MODAL DESIGN */}
            {mounted && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Quick view for ${product.title}`}
                    className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-12"
                >
                    {/* Backdrop */}
                    <div
                        onClick={close}
                        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-400 ${
                            visible ? 'opacity-100' : 'opacity-0'
                        }`}
                    />

                    {/* 
                      Modal Panel 
                      Mobile: Slide-up "Bottom Sheet" (rounded top, fixed bottom, scrollable inner).
                      Desktop: Centered split-panel (sharp edges, side-by-side).
                    */}
                    <div
                        className={`relative z-10 flex w-full flex-col bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] 
                        max-h-[90vh] rounded-t-3xl md:h-[600px] md:max-w-5xl md:flex-row md:rounded-none md:max-h-none ${
                            visible 
                                ? 'translate-y-0 opacity-100 md:scale-100' 
                                : 'translate-y-full opacity-0 md:translate-y-8 md:scale-[0.98]'
                        }`}
                    >
                        {/* Close Button */}
                        <button
                            onClick={close}
                            aria-label="Close dialog"
                            className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-black backdrop-blur transition-transform hover:scale-90 md:right-6 md:top-6 md:rounded-none md:bg-white"
                        >
                            <X size={24} strokeWidth={1.5} />
                        </button>

                        {/* Left Side: Image (Shorter on mobile to leave room for content) */}
                        <div className="relative h-[45vh] w-full shrink-0 overflow-hidden rounded-t-3xl bg-[#f4f4f4] md:h-full md:w-1/2 md:rounded-none">
                            <Image
                                src={product.image}
                                alt={`Detailed full view of ${product.title}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                                priority
                            />
                        </div>

                        {/* Right Side: Content (Scrollable on mobile) */}
                        <div className="flex w-full flex-col overflow-y-auto p-6 md:w-1/2 md:justify-center md:p-14 lg:p-16">
                            <div className="mb-auto">
                                <h2 className="text-xl font-black uppercase tracking-widest text-black md:text-3xl md:leading-tight">
                                    {product.title}
                                </h2>
                                <p className="mt-2 text-xl text-neutral-500 md:mt-4 md:text-2xl">
                                    {product.price} <span className="text-sm md:text-lg">৳</span>
                                </p>
                            </div>

                            <div className="my-6 h-[1px] w-12 bg-black md:my-8"></div>

                            <p className="mb-8 text-sm leading-relaxed text-neutral-600 md:mb-10">
                                Premium quality sportswear engineered with moisture-wicking fabric and an ergonomic athletic fit. Designed for maximum breathability during matches, high-intensity training, or everyday street styling.
                            </p>

                            <div className="mt-auto pb-4 md:pb-0 pt-4">
                                <button
                                    onClick={() => {
                                        addToCart(product, 1, 'XL');
                                        close();
                                    }}
                                    className="group flex h-14 w-full items-center justify-center gap-3 bg-black text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-neutral-800"
                                >
                                    <ShoppingBasket size={18} strokeWidth={1.5} className="transition-transform group-hover:-translate-y-0.5" />
                                    Add to Cart — {product.price}৳
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ProductCard;