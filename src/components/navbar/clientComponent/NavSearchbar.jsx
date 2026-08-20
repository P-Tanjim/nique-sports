'use client'
import { useAdaptiveShadow } from '@/reuseable/useAdaptiveShadow';
import React, { useState, useEffect, useRef } from 'react'

const NavSearchbar = () => {
    const btnRef = useRef(null);
    const isDarkBg = useAdaptiveShadow(btnRef);
    const [isActive, setIsActive] = useState(false);
    const inputRef = useRef(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isActive) {
            inputRef.current?.focus();
        }
    }, [isActive]);

    // Close search bar on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsActive(false);
            }
        };
        if (isActive) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    return (
        <>
            <button
            ref={btnRef}
                onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
                aria-label="Search"
                className={`relative backdrop-blur-sm lg:shadow h-11.5 w-11.5 md:h-10 md:w-10 items-center justify-center text-primary hover:text-primary rounded-full cursor-pointer transition-all duration-300 z-10 ${isDarkBg ? "shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,0.5),inset_0_-8px_8px_-8px_rgba(255,255,255,0.5)]" : "shadow-[inset_0_8px_8px_-8px_rgba(0,0,0,0.2),inset_0_-8px_8px_-8px_rgba(0,0,0,0.2)]"} ${isActive ? "scale-120" : ""}`}
            >
                <svg className="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Backdrop overlay & search modal */}
            <div
                onClick={() => setIsActive(false)}
                className={`fixed inset-0 z-100 transition-all duration-300 ${
                    isActive
                        ? 'opacity-100 pointer-events-auto bg-black/30 backdrop-blur-sm'
                        : 'opacity-0 pointer-events-none bg-transparent backdrop-blur-none'
                }`}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 flex flex-col items-center justify-center ${
                        isActive ? 'top-10 scale-100 opacity-100' : '-top-20 scale-50 opacity-0'
                    }`}
                >
                    <form onSubmit={(e) => e.preventDefault()} className="relative bg-white/40 flex items-center w-xs sm:w-md md:w-lg shadow-lg rounded-full overflow-clip">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search..."
                            className="w-full shadow-[inset_0_8px_8px_-8px_rgba(255,255,255,0.5),inset_0_-8px_8px_-8px_rgba(255,255,255,0.5)] py-2.5 pl-4 pr-10 text-sm text-gray-600 bg-transparent rounded-full outline-none transition-all duration-150 "
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            className="absolute right-1 h-full w-10 flex items-center justify-center text-white hover:text-primary rounded-md cursor-pointer transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>

                    <p className="mt-4 text-white text-sm font-normal text-center">Search your niche. Enter to search</p>
                </div>
            </div>
        </>
    )
}

export default NavSearchbar