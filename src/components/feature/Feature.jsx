import { dancingScript } from '@/app/fonts'
import FeatureCard from './clientComponent/FeatureCard'
import { getFeaturedProducts } from '@/lib/api/requests/requests';

const Feature = async () => {
    const checkProducts = await getFeaturedProducts();
    // const checkProducts = [];


    // Use checkProducts if available, otherwise fallback to static images
    const productsToDisplay = checkProducts?.length>0 ? checkProducts : [];

    return (
        <div className='mb-10 mt-10'>
            <h1 className={`text-center text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>
                Featured Jersey
            </h1>
            <div className='px-4 md:px-20 min-h-80 flex items-center overflow-x-clip overflow-y-visible'>
                <FeatureCard cards={productsToDisplay} />
            </div>
        </div>
    )
}

export default Feature;