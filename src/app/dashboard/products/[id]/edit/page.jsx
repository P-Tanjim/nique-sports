import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/dashboard/products/ProductForm';
import { getCategories } from '@/lib/products';
import { getProductById } from '@/lib/api/products/products';

export const metadata = {
  title: 'Edit Product | Dashboard',
  robots: { index: false, follow: false },
};

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <Link
          href="/dashboard/products"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to products
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Edit product
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Update the product details and save your changes.
        </p>
      </div>
      <ProductForm categories={categories} product={product} productId={id} />
    </div>
  );
}