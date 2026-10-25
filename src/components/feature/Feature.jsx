import { dancingScript } from '@/app/fonts'
import DeferredFeatureCard from './clientComponent/DeferredFeatureCard'
import { getFeaturedProducts } from '@/lib/api/requests/requests';

const Feature = async () => {
    const checkProducts = await getFeaturedProducts();
    // const checkProducts = [];


    // Use checkProducts if available, otherwise fallback to lightweight string paths
    const FALLBACK_PRODUCTS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
        _id: `fallback-${id}`,
        title: `Featured Jersey #${id}`,
        price: 1200,
        imagesLink: [`/products/${id}.webp`],
    }));
    const productsToDisplay = checkProducts?.length > 0 ? checkProducts : FALLBACK_PRODUCTS;

    return (
        <div className='mb-10 mt-10'>
            <h1 className={`text-center text-4xl md:text-6xl lg:text-7xl text-primary ${dancingScript.className}`}>
                Featured Jersey
            </h1>
            <div className='px-4 md:px-20 min-h-80 flex items-center overflow-x-clip overflow-y-visible'>
                <DeferredFeatureCard cards={productsToDisplay} />
            </div>
        </div>
    )
}

export default Feature;