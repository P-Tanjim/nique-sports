'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteProduct } from '@/lib/api/products/products';
import { formatPrice } from '@/lib/format';
import AnimatedSelect from './AnimatedSelect';

const ACTION_OPTIONS = [
  { value: 'edit', label: 'Edit product' },
  { value: 'delete', label: 'Delete product', textColor: 'text-danger' },
];

export default function ProductAdminCard({ product }) {
  const router = useRouter();
  const productId = String(product._id ?? product.slug);
  const image = product.image ?? product.imagesLink?.[0];

  async function handleAction(action) {
    if (action === 'edit') {
      router.push(`/dashboard/products/${productId}/edit`);
      return;
    }

    if (action !== 'delete' || !window.confirm(`Delete "${product.title}"? This cannot be undone.`)) {
      return;
    }

    const result = await deleteProduct(productId);
    if (!result?.success) {
      toast.error(result?.error || 'Could not delete this product.');
      return;
    }

    toast.success('Product deleted.');
    router.refresh();
  }

  return (
    <article className="group relative rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgba(32,36,38,0.05)] transition-shadow hover:shadow-[0_14px_36px_rgba(32,36,38,0.12)]">
      <div className="relative aspect-4/5 overflow-hidden rounded-t-2xl bg-surface">
        <Image
          src={image || '/logo.jpg'}
          alt={product.title || 'Product image'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized={image?.startsWith('data:')}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
          {product.discount && Number(product.discountPercent) > 0 && (
            <span className="rounded-full bg-danger px-2 py-1 text-[10px] font-semibold text-white">
              -{product.discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-semibold text-primary-dark">
              FEATURED
            </span>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl bg-white/95 px-3 py-2 shadow-sm">
          <h2 className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-snug text-text min-[450px]:text-sm">
            {product.title}
          </h2>
          <div className="shrink-0 whitespace-nowrap text-right leading-tight">
            {product.discount && Number(product.beforePrice) > Number(product.price) && (
              <span className="block text-[10px] text-text-muted line-through">
                {formatPrice(product.beforePrice)}৳
              </span>
            )}
            <span className="text-xs font-bold text-text min-[450px]:text-sm">
              {formatPrice(product.price)}৳
            </span>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-30">
        <AnimatedSelect
          id={`product-actions-${productId}`}
          className="w-10"
          options={ACTION_OPTIONS}
          value=""
          onChange={handleAction}
          iconOnly
          triggerIcon={MoreHorizontal}
          triggerLabel={`Actions for ${product.title}`}
          listAlignment="right"
          listClassName="max-h-none overflow-visible"
          textColor="text-text"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 px-3 py-2.5 text-xs text-text-muted">
        <span className="truncate">{product.category || 'Uncategorized'}</span>
        <span className="shrink-0">Stock: {Number(product.stock) || 0}</span>
      </div>
    </article>
  );
}