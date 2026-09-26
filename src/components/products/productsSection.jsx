import { dancingScript } from '@/app/fonts'
import React from 'react'
import ProductCard from './clientComponent/ProductCardHR';
import ProductCardVR from './clientComponent/ProductCardVR';
import { Button } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import { getProducts } from '@/lib/api/products/products';
import Link from 'next/link';

const ProductsSection = async () => {
    const products = await getProducts(10);
    const productList = Array.isArray(products) ? products : [];
    const discountedProducts = productList.filter((product) => product.discount && product.beforePrice > product.price);
    const regularProducts = productList.filter((product) => !discountedProducts.includes(product));
    return (
        <div className='px-4 md:px-20 mx-auto mt-6 mb-10 w-full'>
            <h1 className={`text-center mb-10 text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>Our Jerseys</h1>
            <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
                {regularProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product._id} product={product}></ProductCard>
                ))}
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5'>
                {discountedProducts.slice(0, 4).map((product) => (
                    <ProductCardVR key={product._id} product={product}></ProductCardVR>
                ))}
            </div>

            <Link href='/shop'><Button variant='ghost' className='mt-6 mx-auto flex items-center justify-center gap-2 bg-primary text-white'>See More <ArrowRight size={20} /></Button></Link>
        </div>
    )
}

export default ProductsSection