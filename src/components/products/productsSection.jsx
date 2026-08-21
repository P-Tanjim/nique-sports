import { dancingScript } from '@/app/layout'
import React from 'react'
import ProductCard from './clientComponent/ProductCardHR';
import ProductCardVR from './clientComponent/ProductCardVR';
import { Button } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import ExpandableProfileCard from './clientComponent/Popover';

const ProductsSection = () => {
    const products = [
        { id: 'madrid-home-2627', image: '/featuredProduct/1.jpg', title: 'Madrid Home Kit 26/27 Replica', price: '৩৮০' },
        { id: 'barca-away-2627', image: '/featuredProduct/2.jpg', title: 'FC Barcelona 2026/27 Away Jersey – Player Edition', price: '১১৫০' },
        { id: 'city-home-2627', image: '/featuredProduct/3.jpg', title: 'Manchester City Home Kit 2026/27 Player Edition', price: '৮৫০' },
        { id: 'arsenal-home-2627', image: '/featuredProduct/4.jpg', title: 'Arsenal 26/27 home jersey Player Version', price: '৯০০' },
        { id: 'madrid-blue-bicycle-1718', image: '/featuredProduct/5.jpg', title: 'REAL MADRID 2017/18 BLUE BICYCLE EDITION', price: '৮৯৯' },
        { id: 'barca-undefeated-2526', image: '/featuredProduct/1.jpg', title: 'Barcelona x Undefeated 2025/26 Away Kit – Replica', price: '৫৫০' },
        { id: 'madrid-home-2627-b', image: '/featuredProduct/1.jpg', title: 'Madrid Home Kit 26/27 Replica', price: '৩৮০' },
        { id: 'barca-away-2627-b', image: '/featuredProduct/2.jpg', title: 'FC Barcelona 2026/27 Away Jersey – Player Edition', price: '১১৫০' },
        { id: 'city-home-2627-b', image: '/featuredProduct/3.jpg', title: 'Manchester City Home Kit 2026/27 Player Edition', price: '৮৫০' },
    ];
    return (
        <div className='px-4 md:px-20 mx-auto mt-6 mb-10 w-full'>
            <h1 className={`text-center mb-10 text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>Our Jerseys</h1>
            {/* <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
                {products.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product}></ProductCard>
                ))}
            </div> */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5'>
                {products.slice(6, 10).map((product) => (
                    <ProductCardVR key={product.id} product={product}></ProductCardVR>
                ))}
            </div>

            <div className="flex w-full max-w-sm items-center justify-center p-4">
                <ExpandableProfileCard />
            </div>

            <Button variant='ghost' className='mt-6 mx-auto flex items-center justify-center gap-2 bg-primary text-white'>See More <ArrowRight size={20} /></Button>
        </div>
    )
}

export default ProductsSection