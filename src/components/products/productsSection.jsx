import { dancingScript } from '@/app/layout'
import React from 'react'
import ProductCard from './clientComponent/ProductCard';

const ProductsSection = () => {
    const products = [
        {
            image: '/featuredProduct/1.jpg',
            title: 'Madrid Home Kit 26/27 Replica',
            price: '৩৮০'
        },
        {
            image: '/featuredProduct/2.jpg',
            title: 'FC Barcelona 2026/27 Away Jersey – Player Edition',
            price: '১১৫০'
        },
        {
            image: '/featuredProduct/3.jpg',
            title: 'Manchester City Home Kit 2026/27 Player Edition',
            price: '৮৫০'
        },
        {
            image: '/featuredProduct/4.jpg',
            title: 'Arsenal 26/27 home jersey Player Version',
            price: '৯০০'
        },
        {
            image: '/featuredProduct/5.jpg',
            title: 'REAL MADRID 2017/18 BLUE BICYCLE EDITION',
            price: '৮৯৯'
        },
        {
            image: '/featuredProduct/6.jpg',
            title: 'Barcelona x Undefeated 2025/26 Away Kit – Replica',
            price: '৫৫০'
        },
    ];
    return (
        <div className='px-4 md:px-20 mx-auto mt-6 mb-10 w-full'>
            <h1 className={`text-center mb-10 text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>Our Jerseys</h1>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                {
                    products.map((product, idx) => (
                        <ProductCard key={idx} product={product}></ProductCard>
                    ))
                }

            </div>
        </div>
    )
}

export default ProductsSection