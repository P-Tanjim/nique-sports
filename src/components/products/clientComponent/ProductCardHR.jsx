import Image from 'next/image'
import React from 'react'

const ProductCard = ({ product }) => {
    return (
        <div className='w-full rounded-2xl'>
            <div className='relative w-full h-full rounded-xl overflow-hidden'>
                <Image src={product.image} width={500} height={500} alt="Product Image" className='object-cover h-full w-full'></Image>
                <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/0 to-transparent pointer-events-none z-10' />
                <div className='absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-start'>
                    <p className='text-primary-soft text-[10px] max-w-[70%] font-medium line-clamp-2'>{product.title}</p>
                    <p className='text-primary-soft text-xs font-bold'>{product.price}৳</p>
                </div>
            </div>
        </div>
    )
}

export default ProductCard