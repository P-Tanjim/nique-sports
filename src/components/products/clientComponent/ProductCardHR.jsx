'use client'
import React, { useState, useId, useEffect } from 'react'
import { Scan, ShoppingBasket, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// One shared spring so open + close, and every layoutId element (card,
// image, title), animate with identical timing instead of drifting.
const cardSpring = { type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }

const ProductCard = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);
    const id = useId();
    const layoutId = `product-card-${id}`;

    // Lock background scroll while the popover is open. If the page behind
    // the modal can still move, the card's position shifts mid-measurement
    // — that's what caused it to open/close from the wrong spot.
    useEffect(() => {
        if (!isOpen) return;
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        const prevOverflow = document.body.style.overflow;
        const prevPaddingRight = document.body.style.paddingRight;

        document.body.style.overflow = 'hidden';
        if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

        return () => {
            document.body.style.overflow = prevOverflow;
            document.body.style.paddingRight = prevPaddingRight;
        };
    }, [isOpen]);

    return (
        <>
            <motion.div
                layoutId={layoutId}
                transition={cardSpring}
                // Fixed aspect ratio = a real height on first paint, instead of
                // waiting on the image to load. Adjust the ratio to match your grid.
                className='w-full aspect-4/5 rounded-2xl'
            >
                <div className='relative w-full h-full rounded-xl overflow-hidden group'>
                    <div className='flex flex-col gap-1 absolute top-2 right-2 z-30'>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                            }}
                            title="Quick View"
                            className='w-9 md:w-10 md:h-10 h-9 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200 bg-black/55 rounded-full flex justify-center items-center text-xs text-white font-medium'
                        >
                            <Scan size={14} />
                        </button>
                        <button
                            type="button"
                            title="Add to Cart"
                            className='w-9 h-9 md:w-10 md:h-10 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200 bg-black/55 rounded-full flex justify-center items-center text-xs text-white font-medium'
                        >
                            <ShoppingBasket size={14} />
                        </button>
                    </div>
                    <motion.img
                        layoutId={`image-${layoutId}`}
                        transition={cardSpring}
                        src={product.image}
                        alt={product.title}
                        loading="lazy"
                        decoding="async"
                        className='absolute inset-0 object-cover h-full w-full z-20'
                    />
                    <div className='absolute w-[95%] mx-auto bottom-3 md:bottom-5 left-0 right-0 px-2 py-1.5 z-20 flex justify-between items-start bg-white rounded-xl shadow-sm'>
                        <motion.p layoutId={`title-${layoutId}`} transition={cardSpring} className='text-text text-xs min-[450px]:text-sm sm:text-base max-w-[70%] font-medium line-clamp-2'>{product.title}</motion.p>
                        <p className='text-text text-xs min-[450px]:text-sm sm:text-base font-bold'>{product.price}৳</p>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />

                        <motion.div
                            layoutId={layoutId}
                            transition={cardSpring}
                            className="relative w-full max-w-3xl h-[80vh] md:h-125 bg-white rounded-2xl overflow-hidden border border-gray-100 z-10 flex flex-col md:flex-row shadow-2xl"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center bg-black/70 hover:bg-black rounded-full text-white transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="relative h-64 w-full shrink-0 overflow-hidden md:h-full md:w-1/2">
                                <motion.img
                                    layoutId={`image-${layoutId}`}
                                    transition={cardSpring}
                                    src={product.image}
                                    alt={product.title}
                                    className="absolute inset-0 object-cover h-full w-full z-20"
                                />
                            </div>

                            <div className="p-6 sm:p-8 w-full md:w-1/2 flex flex-col justify-between h-full overflow-y-auto">
                                <div>
                                    <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full inline-block mb-3">
                                        APANIQUE SPORTS
                                    </span>
                                    <motion.h3
                                        layoutId={`title-${layoutId}`}
                                        transition={cardSpring}
                                        className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight"
                                    >
                                        {product.title}
                                    </motion.h3>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-2xl sm:text-3xl font-extrabold text-primary">{product.price}৳</span>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                        Premium quality sportswear jersey engineered with moisture-wicking fabric and ergonomic athletic fit. Perfect for matches, training, or casual wear.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <ShoppingBasket size={18} />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}

export default ProductCard;