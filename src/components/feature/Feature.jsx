import { dancingScript } from '@/app/layout'
import React from 'react'
import ProductOne from '../../../public/featuredProduct/1.jpg'
import ProductTwo from '../../../public/featuredProduct/2.jpg'
import ProductThree from '../../../public/featuredProduct/3.jpg'
import ProductFour from '../../../public/featuredProduct/4.jpg'
import ProductFive from '../../../public/featuredProduct/5.jpg'
import ProductSix from '../../../public/featuredProduct/6.jpg'
import ProductSeven from '../../../public/featuredProduct/7.jpg'
import ProductEight from '../../../public/featuredProduct/8.jpg'
import ProductNine from '../../../public/featuredProduct/9.jpg'
import FeatureCard from './clientComponent/FeatureCard'

const products = [
    { imgURL: ProductOne },
    { imgURL: ProductTwo },
    { imgURL: ProductThree },
    { imgURL: ProductFour },
    { imgURL: ProductFive },
    { imgURL: ProductSix },
    { imgURL: ProductSeven },
    { imgURL: ProductEight },
    { imgURL: ProductNine },
]

const Feature = () => {
    return (
        <div className='mb-10 mt-5'>
            <h1 className={`text-center text-4xl md:text-6xl lg:text-7xl mb-4 text-primary ${dancingScript.className}`}>Featured Jersey</h1>
            <div className='px-4 md:px-20 min-h-80 flex items-center overflow-clip'>
               <FeatureCard cards={products}></FeatureCard>
            </div>
        </div>
    )
}

export default Feature