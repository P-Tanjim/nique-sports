import { Suspense } from 'react';
import ProductBreadcrumb from '@/components/productDetails/ProductBreadcrumb';
import ProductDetails from '@/components/productDetails/ProductDetails';
import ProductDetailsSkeleton from '@/components/productDetails/ProductDetailsSkeleton';
import { getProductById } from '@/lib/api/requests/products';

// ISR: re-checks a product at most once a minute instead of hitting the DB
// on every single request. Raise/lower this depending on how often price or
// stock actually change, or delete the line entirely if you'd rather always
// fetch fresh.
export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: 'Product Not Found | NIQUE SPORTS' };
  }

  return {
    title: `${product.title} | NIQUE SPORTS`,
    description: product.desc,
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  return (
    <main className="min-h-screen text-text">
      <div className="mx-auto max-w-350 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <ProductBreadcrumb />

        {/* Same shape as /shop: an instant shell (breadcrumb, page frame)
            around a single Suspense boundary for the one slow thing on this
            page — the product fetch. The fallback matches the real layout's
            dimensions exactly, so nothing shifts (zero CLS) when the real
            content swaps in. */}
        <Suspense fallback={<ProductDetailsSkeleton />}>
          <ProductDetails id={id} />
        </Suspense>
      </div>
    </main>
  );
}