import { dancingScript } from '@/app/fonts'
import React from 'react'
import ProductCard from './clientComponent/ProductCardHR';
import ProductCardVR from './clientComponent/ProductCardVR';
import { ArrowRight } from 'lucide-react';
import { getProducts } from '@/lib/api/products/products';
import Link from 'next/link';

const ProductsSection = async () => {
    const products = await getProducts(10);
    const productList = Array.isArray(products) ? products : [];
    const discountedProducts = productList.filter((product) => product.discount && product.beforePrice > product.price);
    const regularProducts = productList.filter((product) => !discountedProducts.includes(product));
    return (
        <section className='px-4 md:px-20 mx-auto mt-6 mb-10 w-full section-visibility-products'>
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

            <Link
                href="/shop"
                className="mt-6 mx-auto flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white transition-transform active:scale-95 hover:bg-primary-dark"
            >
                Browse all jerseys <ArrowRight size={20} />
            </Link>
        </section>
    )
}

export default ProductsSection