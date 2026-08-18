'use client'
import React from 'react'

const NavSearchbar = () => {
    return (
        <form onSubmit={(e) => e.preventDefault()} className="relative ml-6 flex items-center w-lg shadow rounded-xl">
            <input
                type="text"
                placeholder="Search..."
                className="w-full py-2 pl-3.5 pr-10 text-sm text-gray-800 bg-white border border-white rounded-xl outline-none transition-all duration-150 focus:border-primary-soft focus:ring-1 focus:ring-primary-soft"
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
    )
}

export default NavSearchbar