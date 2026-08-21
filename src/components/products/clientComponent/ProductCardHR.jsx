'use client'
import Image from 'next/image'
import React, { useState, useId, useEffect } from 'react'
import { Scan, ShoppingBasket, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ProductCard = ({ product }) => {
    const [isOpen, setIsOpen] = useState(false);
    const id = useId();
    const layoutId = `product-card-${id}`;

    // Prevent background scroll while the popover is open — this also
    // removes the last thing that could trigger a mobile viewport/toolbar
    // resize while the shared-layout animation is mid-flight.
    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    return (
        <>
            <motion.div 
                layoutId={layoutId} 
                className='w-full rounded-2xl'
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
                    {/* <Image src={coverImg} className='absolute top-0 z-10 w-full h-full object-cover' width={500} height={500} alt="Cover" /> */}
                    <motion.img 
                        layoutId={`image-${layoutId}`}
                        src={product.image} 
                        alt={product.title}
                        className='relative object-cover h-full w-full z-20'
                    />
                    <div className='absolute w-[95%] mx-auto bottom-3 md:bottom-5 left-0 right-0 px-2 py-1.5 z-20 flex justify-between items-start bg-white rounded-xl shadow-sm'>
                        <motion.p layoutId={`title-${layoutId}`} className='text-text text-xs min-[450px]:text-sm sm:text-base max-w-[70%] font-medium line-clamp-2'>{product.title}</motion.p>
                        <p className='text-text text-xs min-[450px]:text-sm sm:text-base font-bold'>{product.price}৳</p>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/70"
                        />

                        {/* Popover Modal */}
                        <motion.div
                            layoutId={layoutId}
                            className="relative w-full max-w-3xl h-[80svh] md:h-125 bg-white rounded-2xl overflow-hidden border border-gray-100 z-10 flex flex-col md:flex-row shadow-2xl"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center bg-black/60 hover:bg-black rounded-full text-white transition-colors backdrop-blur-sm cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                            
                            {/* Image Section matching card image layout exactly */}
                            <div className="relative h-64 w-full shrink-0 overflow-hidden md:h-full md:w-1/2">
                                {/* <Image src={coverImg} className='absolute top-0 z-10 w-full h-full object-cover' width={500} height={500} alt="Cover" /> */}
                                <motion.img 
                                    layoutId={`image-${layoutId}`} 
                                    src={product.image} 
                                    alt={product.title}
                                    className="relative object-cover h-full w-full z-20" 
                                />
                            </div>
                            
                            {/* Details Section */}
                            <div className="p-6 sm:p-8 w-full md:w-1/2 flex flex-col justify-between h-full overflow-y-auto">
                                <div>
                                    <motion.h3 
                                        layoutId={`title-${layoutId}`} 
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