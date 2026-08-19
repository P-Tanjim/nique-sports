'use client'
import React, { useState, useEffect, useRef } from 'react'

const NavSearchbar = () => {
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
                onClick={(e) => { e.stopPropagation(); setIsActive(!isActive); }}
                aria-label="Search"
                className="bg-white shadow h-10 w-10 flex items-center justify-center text-gray-400 hover:text-primary rounded-full cursor-pointer transition-colors z-10"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>

            {/* Backdrop overlay & search modal */}
            <div
                onClick={() => setIsActive(false)}
                className={`fixed inset-0 z-50 transition-all duration-300 ${
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
                    <form onSubmit={(e) => e.preventDefault()} className="relative flex items-center w-xs sm:w-md md:w-lg shadow-lg rounded-xl">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search..."
                            className="w-full py-2.5 pl-4 pr-10 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl outline-none transition-all duration-150 focus:border-primary-soft focus:ring-1 focus:ring-primary-soft"
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            className="absolute right-1 h-full w-10 flex items-center justify-center text-gray-400 hover:text-primary rounded-md cursor-pointer transition-colors"
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