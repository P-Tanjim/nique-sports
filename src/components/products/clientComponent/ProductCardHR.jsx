'use client'
import Image from 'next/image'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Scan, ShoppingBasket, X } from 'lucide-react'

const TRANSITION_MS = 300;

const ProductCard = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);   // did the user ask to open it
    const [mounted, setMounted] = useState(false); // is the modal in the DOM at all
    const [visible, setVisible] = useState(false); // has it transitioned in
    const mountedRef = useRef(false);
    const closeTimerRef = useRef(null);

    const open = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setIsOpen(true);

        if (mountedRef.current) {
            // Re-opened before the close transition finished — the node is
            // already in the DOM, so just reverse straight back to visible.
            setVisible(true);
            return;
        }

        mountedRef.current = true;
        setMounted(true);
        // Wait two frames before revealing: the first lets the browser
        // actually paint the "closed" starting state, the second is where
        // we flip to "open" — skip this and the two states can get
        // collapsed into a single frame, and it just jumps instead of
        // transitioning.
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

    // While the modal exists: lock background scroll and let Escape close it.
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

    // Clean up a pending close timer if the component unmounts mid-close.
    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }, []);

    return (
        <>
            <div className='w-full rounded-2xl'>
                <div className='relative w-full h-full rounded-xl overflow-hidden group'>
                    <div className='flex flex-col gap-1 absolute top-2 right-2 z-30'>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); open(); }}
                            title="Quick View"
                            className='w-9 md:w-10 md:h-10 h-9 cursor-pointer hover:scale-110 transition-transform duration-300 backdrop-blur-sm bg-black/50 rounded-full flex justify-center items-center text-xs text-white font-medium'
                        >
                            <Scan size={14} />
                        </button>
                        <button
                            type="button"
                            title="Add to Cart"
                            className='w-9 h-9 md:w-10 md:h-10 cursor-pointer hover:scale-110 transition-transform duration-300 backdrop-blur-sm bg-black/50 rounded-full flex justify-center items-center text-xs text-white font-medium'
                        >
                            <ShoppingBasket size={14} />
                        </button>
                    </div>
                    <Image
                        src={product.image}
                        alt={product.title}
                        width={150}
                        height={150}
                        className='object-cover z-20 h-full w-full'
                    />
                    <div className='absolute w-[95%] mx-auto bottom-3 md:bottom-5 left-0 right-0 px-2 py-1.5 z-20 flex justify-between items-start bg-white rounded-xl shadow-sm'>
                        <p className='text-text text-xs min-[450px]:text-sm sm:text-base max-w-[70%] font-medium line-clamp-2'>{product.title}</p>
                        <p className='text-text text-xs min-[450px]:text-sm sm:text-base font-bold'>{product.price}৳</p>
                    </div>
                </div>
            </div>

            {mounted && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={product.title}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
                >
                    {/* Backdrop */}
                    <div
                        onClick={close}
                        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 ${
                            visible ? 'opacity-100' : 'opacity-0'
                        }`}
                    />

                    {/* Popover panel — simple fade + scale, no shared-element measurement */}
                    <div
                        className={`relative w-full max-w-3xl h-[80svh] md:h-125 bg-white rounded-2xl overflow-hidden border border-gray-100 z-10 flex flex-col md:flex-row shadow-2xl transition duration-300 ease-out ${
                            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                    >
                        <button
                            onClick={close}
                            aria-label="Close"
                            className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center bg-black/60 hover:bg-black rounded-full text-white transition-colors backdrop-blur-sm cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className="relative h-64 w-full shrink-0 overflow-hidden md:h-full md:w-1/2">
                            <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover z-20"
                            />
                        </div>

                        <div className="p-6 sm:p-8 w-full md:w-1/2 flex flex-col justify-between h-full overflow-y-auto">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                                    {product.title}
                                </h3>

                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-primary">{product.price}৳</span>
                                </div>

                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    Premium quality sportswear jersey engineered with moisture-wicking fabric and ergonomic athletic fit. Perfect for matches, training, or casual wear.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={close}
                                    className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <ShoppingBasket size={18} />
                                    Add to Cart
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