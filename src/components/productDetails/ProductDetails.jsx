import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/api/requests/products';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import CustomizationInfo from './CustomizationInfo';
import PatchGallery from './PatchGallery';
import PurchasePanel from './PurchasePanel';

// Async Server Component — the one piece of this page that actually awaits
// a network call. Everything above it (breadcrumb, the page frame) renders
// instantly; this is exactly what the Suspense boundary in page.js waits on,
// the same relationship ProductGrid has with page.js on /shop.
export default async function ProductDetails({ id }) {
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mt-6 lg:grid lg:grid-cols-2 lg:gap-12">
      <ProductGallery images={product.imagesLink} title={product.title} />

      <div className="mt-8 lg:mt-0">
        <ProductInfo product={product} />
        <PurchasePanel product={product} id={id} />
        <CustomizationInfo font={product.font} patch={product.patch} />

        {product.patch && <PatchGallery images={product.patchsImg} />}
      </div>
    </div>
  );
}