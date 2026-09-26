'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';
import IOSSwitch from './IOSSwitch';
import AnimatedSelect from './AnimatedSelect';
import SizeSelector from './SizeSelector';
import ImageUploader from './ImageUploader';
import { createProduct, getFeaturedProductCount } from '@/lib/api/products/products';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_FALLBACK = [
  { value: 'BD Premium', label: 'BD Premium' },
  { value: 'Manufactured Retro', label: 'Manufactured Retro' },
  { value: 'Player Edition Replica', label: 'Player Edition Replica' },
  { value: 'Player Edition', label: 'Player Edition' },
];

const initialState = {
  title: '',
  desc: '',
  price: '',
  stock: '',
  team: '',
  seassion: '',
  category: '',
  size: [],
  patch: false,
  font: false,
  featured: false,
  discount: false,
  beforePrice: '',
  imagesLink: [],
  patchsImg: [],
  fontsImg: [],
};

export default function ProductForm({ categories }) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [showFeaturedLimitModal, setShowFeaturedLimitModal] = useState(false);
  const [shake, setShake] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(0);

  const categoryOptions =
    categories?.length > 0
      ? categories.map((c) => ({ value: c.name, label: c.name }))
      : CATEGORY_FALLBACK;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function showValidationError(message) {
    toast.error(message);
    setShake(false);
    requestAnimationFrame(() => setShake(true));
  }

  function handleUploadingChange(isUploading) {
    setUploadingImages((count) => Math.max(0, count + (isUploading ? 1 : -1)));
  }

  async function saveProduct(productForm) {
    setSaving(true);

    try {
      const priceNum = Number(productForm.price);
      const beforePriceNum = productForm.discount ? Number(productForm.beforePrice) : 0;
      const discountPercent = productForm.discount ? liveDiscountPercent : 0;
      const result = await createProduct({
        ...productForm,
        price: priceNum,
        beforePrice: beforePriceNum,
        discountPercent,
        stock: Number(productForm.stock) || 0,
        patchsImg: productForm.patch ? productForm.patchsImg : [],
        fontsImg: productForm.font ? productForm.fontsImg : [],
      });

      if (!result?.success) {
        toast.error(result?.error || 'Could not add the product.');
        return;
      }

      toast.success('Product added.');
      setForm(initialState);
      router.refresh();
    } catch (error) {
      toast.error('Network or server error occurred.');
      console.error('Submission error:', error);
    } finally {
      setSaving(false);
    }
  }

  // Calculate live discount percentage for UI preview
  const liveDiscountPercent =
    form.discount && Number(form.beforePrice) > Number(form.price) && Number(form.price) > 0
      ? Math.round(((Number(form.beforePrice) - Number(form.price)) / Number(form.beforePrice)) * 100)
      : 0;

  async function handleSubmit(e) {
    e.preventDefault();

    if (uploadingImages > 0) {
      toast.error('Please wait for all images to finish uploading.');
      return;
    }

    if (!form.title.trim() || !form.price || !form.category) {
      showValidationError('Title, price and category are required.');
      return;
    }

    // Size validation
    if (form.size.length === 0) {
      showValidationError('Please select at least one size.');
      return;
    }

    // Discount validation
    if (form.discount) {
      if (!form.beforePrice) {
        showValidationError('Please enter the before price for discount.');
        return;
      }
      if (Number(form.beforePrice) <= Number(form.price)) {
        showValidationError('Before price must be greater than current price.');
        return;
      }
    }

    if (form.imagesLink.length === 0) {
      showValidationError('Add at least one product image.');
      return;
    }

    if (form.patch && form.patchsImg.length === 0) {
      showValidationError('Please add at least one patch image, or turn off "Patch available".');
      return;
    }

    if (form.font && form.fontsImg.length === 0) {
      showValidationError('Please add at least one font image, or turn off "Custom font".');
      return;
    }

    if (form.featured) {
      setSaving(true);
      let featuredCount;
      try {
        featuredCount = await getFeaturedProductCount();
      } catch {
        toast.error('Could not check featured products. Please try again.');
        return;
      } finally {
        setSaving(false);
      }

      if (featuredCount === null) {
        toast.error('Could not check featured products. Please try again.');
        return;
      }

      if (featuredCount >= 9) {
        setShowFeaturedLimitModal(true);
        return;
      }
    }

    await saveProduct(form);
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${shake ? 'animate-form-shake' : ''}`} onAnimationEnd={() => setShake(false)}>
      {/* BASIC INFO */}
      <section className="relative z-30 rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Basic information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="BD Premium Home Jersey"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Description
            </label>
            <textarea
              rows={3}
              value={form.desc}
              onChange={(e) => set('desc', e.target.value)}
              placeholder="High quality jersey with editable font and patch..."
              className="mt-1.5 w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              {form.discount ? 'Selling / Discounted Price (৳)' : 'Price (৳)'}
            </label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="1050"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Stock
            </label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              placeholder="10"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Team
            </label>
            <input
              type="text"
              value={form.team}
              onChange={(e) => set('team', e.target.value)}
              onBlur={(e) => set('team', e.target.value.trim().toLowerCase().replace(/\s+/g, '-'))}
              placeholder="real-madrid"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
              Season
            </label>
            <input
              type="text"
              value={form.seassion}
              onChange={(e) => set('seassion', e.target.value)}
              placeholder="25-26"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <AnimatedSelect
              id="category-select"
              label="Category"
              options={categoryOptions}
              value={form.category}
              onChange={(v) => set('category', v)}
              placeholder="Choose a category"
            />
          </div>
        </div>
      </section>

      {/* SIZES */}
      <section className="relative z-20 rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Available sizes
        </h2>
        <div className="mt-4">
          <SizeSelector value={form.size} onChange={(v) => set('size', v)} />
        </div>
      </section>

      {/* TOGGLES */}
      <section className="relative z-10 divide-y divide-border rounded-3xl border border-border bg-white/80 px-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:px-8">
        <div className="py-4">
          <IOSSwitch
            label="Custom font"
            description="Buyer can pick a name/number font on the back"
            checked={form.font}
            onChange={(v) => set('font', v)}
          />
        </div>
        <div className="py-4">
          <IOSSwitch
            label="Featured"
            description="Show this product in the featured section"
            checked={form.featured}
            onChange={(v) => set('featured', v)}
          />
        </div>
        <div className="py-4">
          <IOSSwitch
            label="Patch available"
            description="Buyer can add a patch to this jersey"
            checked={form.patch}
            onChange={(v) => set('patch', v)}
          />
        </div>

        {/* DISCOUNT TOGGLE & INPUT */}
        <div className="py-4">
          <IOSSwitch
            label="Discount available"
            description="Enable promotional pricing with a strike-through original price"
            checked={form.discount}
            onChange={(v) => set('discount', v)}
          />

          <AnimatePresence>
            {form.discount && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4 grid gap-4 sm:grid-cols-2 items-center">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                      Before Price (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.beforePrice}
                      onChange={(e) => set('beforePrice', e.target.value)}
                      placeholder="1450"
                      className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  {liveDiscountPercent > 0 && (
                    <div className="sm:mt-5 w-fit flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-700">
                      <span>Discount:</span>
                      <span className="rounded-lg bg-emerald-600 px-2 py-0.5 font-bold text-white">
                        {liveDiscountPercent}% OFF
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* IMAGES */}
      <section className="relative z-0 rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Product images
        </h2>
        <div className="mt-4">
          <ImageUploader
            label="Product image"
            value={form.imagesLink}
            onChange={(v) => set('imagesLink', v)}
            onUploadingChange={handleUploadingChange}
            watermark
          />
        </div>

        <AnimatePresence>
          {form.patch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-6">
                <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Patch images
                </h3>
                <div className="mt-3">
                  <ImageUploader
                    label="Patch image"
                    value={form.patchsImg}
                    onChange={(v) => set('patchsImg', v)}
                    onUploadingChange={handleUploadingChange}
                    max={4}
                    withPrice
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {form.font && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-6">
                <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Font references
                </h3>
                <div className="mt-3">
                  <ImageUploader
                    label="Font image"
                    value={form.fontsImg}
                    onChange={(v) => set('fontsImg', v)}
                    onUploadingChange={handleUploadingChange}
                    max={4}
                    withPrice
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={saving || uploadingImages > 0}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 sm:w-auto sm:px-10"
      >
        {saving || uploadingImages > 0 ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving…' : uploadingImages > 0 ? 'Uploading images…' : 'Add product'}
      </button>

      <AnimatePresence>
        {showFeaturedLimitModal && (
          <motion.div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 px-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFeaturedLimitModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="featured-limit-title"
              className="w-full max-w-85 overflow-hidden rounded-[22px] bg-white/95 text-center shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-6 pb-5 pt-6">
                <h2 id="featured-limit-title" className="text-base font-semibold text-gray-900">
                  Featured products are full (limit 9).
                </h2>
                <p className="mt-1.5 text-sm text-gray-600">
                  Add this product without featuring it?
                </p>
              </div>
              <div className="grid grid-cols-2 border-t border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setShowFeaturedLimitModal(false)}
                  className="border-r cursor-pointer border-gray-200/80 py-3.5 text-[15px] font-medium text-blue-600 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeaturedLimitModal(false);
                    saveProduct({ ...form, featured: false });
                  }}
                  className="py-3.5 cursor-pointer text-[15px] font-semibold text-blue-600 transition-colors hover:bg-gray-200"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}