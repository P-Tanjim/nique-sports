import { dancingScript } from '@/app/fonts'
import FeatureCard from './clientComponent/FeatureCard'
import { getFeaturedProducts } from '@/lib/api/requests/requests';
import ProductOne from '../../../public/featuredProduct/1.jpg'
import ProductTwo from '../../../public/featuredProduct/2.jpg'
import ProductThree from '../../../public/featuredProduct/3.jpg'
import ProductFour from '../../../public/featuredProduct/4.jpg'
import ProductFive from '../../../public/featuredProduct/5.jpg'
import ProductSix from '../../../public/featuredProduct/6.jpg'
import ProductSeven from '../../../public/featuredProduct/7.jpg'
import ProductEight from '../../../public/featuredProduct/8.jpg'
import ProductNine from '../../../public/featuredProduct/9.jpg'

const fallbackProducts = [
    { imageLink: ProductOne },
    { imageLink: ProductTwo },
    { imageLink: ProductThree },
    { imageLink: ProductFour },
    { imageLink: ProductFive },
    { imageLink: ProductSix },
    { imageLink: ProductSeven },
    { imageLink: ProductEight },
    { imageLink: ProductNine },
]

const Feature = async () => {
    // const checkProducts = await getFeaturedProducts();
    const checkProducts = [];


    // Use checkProducts if available, otherwise fallback to static images
    const productsToDisplay = checkProducts?.length>0 ? checkProducts : fallbackProducts;

    return (
        <div className='mb-10 mt-10'>
            <h1 className={`text-center text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>
                Featured Jersey
            </h1>
            <div className='px-4 md:px-20 min-h-80 flex items-center overflow-clip'>
                <FeatureCard cards={productsToDisplay} />
            </div>
        </div>
    )
}

export default Feature;