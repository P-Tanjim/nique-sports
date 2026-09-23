'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';
import IOSSwitch from './IOSSwitch';
import AnimatedSelect from './AnimatedSelect';
import SizeSelector from './SizeSelector';
import ImageUploader from './ImageUploader';
import { createProduct } from '@/lib/api/products/products';
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
  imagesLink: [],
  patchsImg: [],
};

export default function ProductForm({ categories }) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);

  const categoryOptions =
    categories?.length > 0
      ? categories.map((c) => ({ value: c.name, label: c.name }))
      : CATEGORY_FALLBACK;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim() || !form.price || !form.category) {
      toast.error('Title, price and category are required.');
      return;
    }
    if (form.imagesLink.length === 0) {
      toast.error('Add at least one product image.');
      return;
    }

    setSaving(true);
    const result = await createProduct({
      ...form,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      patchsImg: form.patch ? form.patchsImg : [],
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error || 'Could not add the product.');
      return;
    }

    toast.success('Product added.');
    setForm(initialState);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* BASIC INFO: Added `relative z-30` so dropdown floats above lower sections */}
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
              Price (৳)
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

      {/* SIZES: Changed to `relative z-20` */}
      <section className="relative z-20 rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Available sizes
        </h2>
        <div className="mt-4">
          <SizeSelector value={form.size} onChange={(v) => set('size', v)} />
        </div>
      </section>

      {/* TOGGLES: Added `relative z-10` */}
      <section className="relative z-10 divide-y divide-border rounded-3xl border border-border bg-white/80 px-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)]   sm:px-8">
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
      </section>

      {/* IMAGES */}
      <section className="relative z-0 rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Product images
        </h2>
        <div className="mt-4">
          <ImageUploader label="Product image" value={form.imagesLink} onChange={(v) => set('imagesLink', v)} />
        </div>

        {/* AnimatePresence handles the exit animation before removing the element from the DOM */}
        <AnimatePresence>
          {form.patch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              {/* Note: Changed mt-6 to pt-6 here to prevent CSS margin-collapse layout jumps during animation */}
              <div className="pt-6">
                <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Patch images
                </h3>
                <div className="mt-3">
                  <ImageUploader
                    label="Patch image"
                    value={form.patchsImg}
                    onChange={(v) => set('patchsImg', v)}
                    max={4}
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
        disabled={saving}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 sm:w-auto sm:px-10"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving…' : 'Add product'}
      </button>
    </form>
  );
}