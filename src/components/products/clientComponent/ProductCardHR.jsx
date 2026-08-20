import Image from 'next/image'
import React from 'react'
import coverImg from '../../../../public/proBG.jpeg'

const ProductCard = ({ product }) => {
    return (
        <div className='w-full rounded-2xl'>
            <div className='relative w-full h-full rounded-xl overflow-hidden'>
                <Image src={coverImg} className='absolute top-0 z-10 w-full h-full object-cover' width={500} height={500} alt="Cover"></Image>
                <Image src={product.image} width={500} height={500} alt="Product Image" className='relative object-cover h-full w-full z-20 -translate-y-2 transition-transform duration-300'></Image>
                <div className='absolute w-[95%] mx-auto bottom-3 left-0 right-0 px-2 py-1.5 z-20 flex justify-between items-start bg-white rounded-xl'>
                    <p className='text-text text-[10px] max-w-[70%] font-medium line-clamp-2'>{product.title}</p>
                    <p className='text-text text-xs font-bold'>{product.price}৳</p>
                </div>
            </div>
        </div>
    )
}

export default ProductCard;