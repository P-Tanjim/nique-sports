import { getCategories } from '@/lib/products';
import ProductForm from '@/components/dashboard/products/ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Add Product | Dashboard',
};

// Server Component — the only thing it awaits is the category list, so the
// page ships instantly and every interactive bit (switches, dropdown,
// image upload) lives inside <ProductForm>, a Client Component below it.
export default async function AddProductPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/dashboard/products"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to products
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          Add a product
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Fill in the details below - it's saved straight to your catalog.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}