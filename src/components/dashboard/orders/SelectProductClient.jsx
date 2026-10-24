'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Search, Shirt, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Switch } from '@heroui/react';
import AnimatedSelect from '@/components/dashboard/products/AnimatedSelect';
import { formatPrice } from '@/lib/format';

const IOS_EASE = [0.32, 0.72, 0, 1];

// HeroUI custom switch component
function HeroUISwitch({ checked, onChange, label, size = 'md' }) {
  return (
    <Switch
      isSelected={Boolean(checked)}
      onChange={(val) => {
        const next = typeof val === 'boolean' ? val : Boolean(val?.target?.checked);
        onChange?.(next);
      }}
      aria-label={label || 'Toggle'}
      size={size}
    >
      {({ isSelected }) => (
        <Switch.Content className="cursor-pointer">
          <Switch.Control className={isSelected ? 'bg-primary!' : ''}>
            <Switch.Thumb>
              <Switch.Icon />
            </Switch.Thumb>
          </Switch.Control>
        </Switch.Content>
      )}
    </Switch>
  );
}

function getInitialSelections() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = sessionStorage.getItem('nique_selected_products');
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return {};
    const map = {};
    parsed.forEach((item) => {
      const pId = String(item.productId);
      map[pId] = {
        selected: true,
        size: item.size || '',
        fontEnabled: Boolean(item.font || item.customization?.name || item.customization?.number),
        selectedFont: item.font || null,
        name: item.customization?.name || '',
        number: item.customization?.number || '',
        patchEnabled: Boolean(item.patches && item.patches.length > 0),
        selectedPatches: Array.isArray(item.patches) ? item.patches : [],
        quantity: item.quantity || 1,
      };
    });
    return map;
  } catch {
    return {};
  }
}

export default function SelectProductClient({ products = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard/orders/add';

  const [search, setSearch] = useState('');
  const [selections, setSelections] = useState(getInitialSelections);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const categoryMatch = (p.category || '').toLowerCase().includes(q);
      const teamMatch = (p.team || '').toLowerCase().includes(q);
      return titleMatch || categoryMatch || teamMatch;
    });
  }, [products, search]);

  const selectedCount = useMemo(() => {
    return Object.values(selections).filter((s) => s?.selected).length;
  }, [selections]);

  const updateItem = (productId, patch) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {
          selected: false,
          size: '',
          fontEnabled: false,
          selectedFont: null,
          name: '',
          number: '',
          patchEnabled: false,
          selectedPatches: [],
          quantity: 1,
        }),
        ...patch,
      },
    }));
  };

  const handleToggleSelect = (product, isSelected) => {
    const id = String(product._id);
    const existing = selections[id];
    // Default size to first available size if not already set
    const defaultSize = existing?.size || (product.size?.length ? product.size[0] : '');

    updateItem(id, {
      selected: isSelected,
      size: isSelected ? defaultSize : (existing?.size || ''),
    });
  };

  const handleDone = () => {
    const selectedEntries = Object.entries(selections).filter(([, val]) => val?.selected);

    if (selectedEntries.length === 0) {
      toast.error('Please select at least one product.');
      return;
    }

    // Validate size selection
    for (const [pId, val] of selectedEntries) {
      const prod = products.find((p) => String(p._id) === pId);
      if (!val.size) {
        toast.error(`Please select a size for "${prod?.title || 'the product'}"`);
        return;
      }
      if (val.fontEnabled && (val.name || val.number)) {
        if (prod?.fontsImg?.length > 0 && !val.selectedFont) {
          toast.error(`Please choose a font style for "${prod?.title}"`);
          return;
        }
      }
    }

    // Build order items
    const formattedItems = selectedEntries.map(([pId, val]) => {
      const prod = products.find((p) => String(p._id) === pId) || {};
      const basePrice = Number(prod.price) || 0;
      const fontPrice = val.fontEnabled && val.selectedFont ? Number(val.selectedFont.price) || 0 : 0;
      const patchesPrice = val.patchEnabled && Array.isArray(val.selectedPatches)
        ? val.selectedPatches.reduce((sum, p) => sum + (Number(p?.price) || 0), 0)
        : 0;
      const unitPrice = basePrice + fontPrice + patchesPrice;
      const quantity = Number(val.quantity) || 1;

      return {
        productId: pId,
        title: prod.title || 'Product',
        image: prod.imagesLink?.[0] || '',
        size: val.size,
        quantity,
        basePrice,
        unitPrice,
        lineTotal: unitPrice * quantity,
        font: val.fontEnabled ? val.selectedFont : null,
        customization: {
          name: val.fontEnabled ? (val.name || '') : '',
          number: val.fontEnabled ? (val.number || '') : '',
        },
        patches: val.patchEnabled ? (val.selectedPatches || []) : [],
      };
    });

    try {
      sessionStorage.setItem('nique_selected_products', JSON.stringify(formattedItems));
    } catch (err) {
      console.error('Failed to save to sessionStorage:', err);
    }

    toast.success(`Added ${formattedItems.length} ${formattedItems.length === 1 ? 'product' : 'products'}.`);
    router.push(returnUrl);
  };

  return (
    <div className="relative z-10 isolate mx-auto w-full max-w-4xl pb-24">
      {/* Upper Navigation Bar: Back on left, Done on right */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(returnUrl)}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 active:scale-95"
        >
          <ArrowLeft size={16} />
          <span className='mb-1'>Back</span>
        </button>

        <button
          type="button"
          onClick={handleDone}
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-95"
        >
          <span className="mb-0.5 space-x-1">Done{selectedCount > 0 ? `(${selectedCount})` : ''}</span> 
          <Check size={16} />
        </button>
      </div>

      {/* Page Title & Search Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Select product</h1>

        {/* Search input */}
        <div className="relative mt-5">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, team, category…"
            className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-10 text-sm text-text outline-none transition-colors focus:border-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product, index) => {
          const id = String(product._id);
          const state = selections[id] || {
            selected: false,
            size: '',
            fontEnabled: false,
            selectedFont: null,
            name: '',
            number: '',
            patchEnabled: false,
            selectedPatches: [],
            quantity: 1,
          };

          const isSelected = Boolean(state.selected);
          const thumbnail = product.imagesLink?.[0];
          const hasFont = Boolean(product.font && product.fontsImg?.length > 0);
          const hasPatch = Boolean(product.patch && product.patchsImg?.length > 0);

          const sizeOptions = (product.size || []).map((s) => ({ value: s, label: s }));

          const cardZIndex = isSelected
            ? 10 + (filteredProducts.length - index)
            : filteredProducts.length - index;

          return (
            <div
              key={id}
              style={{ zIndex: cardZIndex }}
              className={`relative rounded-3xl border transition-all duration-200 ${
                isSelected
                  ? 'border-primary/60 bg-white overflow-visible'
                  : 'border-border bg-white hover:border-border/80 overflow-hidden'
              }`}
            >
              {/* Top Row: Product image, title, price on left, Switch on right */}
              <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={product.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <Shirt size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-1 text-sm font-semibold text-text sm:text-base">
                      {product.title}
                    </h2>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product.price)}৳
                      </span>
                      {product.discount && Number(product.beforePrice) > Number(product.price) && (
                        <span className="text-xs text-text-muted line-through">
                          {formatPrice(product.beforePrice)}৳
                        </span>
                      )}
                      {product.category && (
                        <span className="hidden sm:inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Switch */}
                <div className="shrink-0 flex items-center gap-3">
                  <span className="hidden sm:inline text-xs font-semibold text-text-muted">
                    {isSelected ? 'Selected' : 'Add'}
                  </span>
                  <HeroUISwitch
                    checked={isSelected}
                    onChange={(val) => handleToggleSelect(product, val)}
                    label={`Select ${product.title}`}
                    size="md"
                  />
                </div>
              </div>

              {/* Second Part: Size, Font, Patch (Shown when Product Switch is ON) */}
              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div
                    key="options-drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                    exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.32, ease: IOS_EASE }}
                    className="border-t border-border/80 bg-surface/40"
                  >
                    <div className="p-4 sm:p-5">
                      {/* Control row: Size select + Font button/switch + Patch button/switch */}
                      <div className="relative z-40 flex flex-wrap items-center gap-3">
                        {/* Custom Animated Selector for available sizes */}
                        <div className="w-full sm:w-44">
                          <AnimatedSelect
                            id={`size-select-${id}`}
                            options={sizeOptions}
                            value={state.size}
                            onChange={(val) => updateItem(id, { size: val })}
                            placeholder="Select size"
                            triggerLabel="Size"
                            className="w-full"
                            triggerClassName="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-white px-3.5 py-2.5 text-left text-sm font-medium text-text outline-none hover:border-primary/50 transition-colors"
                          />
                        </div>

                        {/* Font button with switch */}
                        {hasFont && (
                          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-white px-3.5 py-1.5">
                            <span className="text-xs font-semibold text-text">Font</span>
                            <HeroUISwitch
                              checked={state.fontEnabled}
                              onChange={(val) => updateItem(id, { fontEnabled: val })}
                              label="Enable Font"
                              size="sm"
                            />
                          </div>
                        )}

                        {/* Patch button with switch */}
                        {hasPatch && (
                          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-white px-3.5 py-1.5">
                            <span className="text-xs font-semibold text-text">Patch</span>
                            <HeroUISwitch
                              checked={state.patchEnabled}
                              onChange={(val) => updateItem(id, { patchEnabled: val })}
                              label="Enable Patch"
                              size="sm"
                            />
                          </div>
                        )}
                      </div>

                      {/* Font Details Part (When Font Switch is ON) */}
                      <AnimatePresence initial={false}>
                        {state.fontEnabled && hasFont && (
                          <motion.div
                            key="font-drawer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: IOS_EASE }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3.5">
                              <div className="rounded-2xl border border-border bg-white p-4 space-y-3.5">
                                <div>
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                      Select Font Style (Choose one)
                                    </span>
                                    {state.selectedFont && Number(state.selectedFont.price) > 0 && (
                                      <span className="text-xs font-bold text-primary">
                                        +{formatPrice(state.selectedFont.price)}৳
                                      </span>
                                    )}
                                  </div>

                                  {/* Row 1: Font images in 1 row */}
                                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {product.fontsImg.map((entry, idx) => {
                                      const option = typeof entry === 'string' ? { image: entry, price: 0 } : entry;
                                      const src = option.image;
                                      const isSelectedFont = state.selectedFont?.image === src;

                                      return (
                                        <button
                                          key={src + idx}
                                          type="button"
                                          onClick={() => updateItem(id, { selectedFont: isSelectedFont ? null : option })}
                                          className={`group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 p-1 transition-all ${
                                            isSelectedFont
                                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                              : 'border-border bg-surface hover:border-primary/40'
                                          }`}
                                        >
                                          <Image src={src} alt={`Font ${idx + 1}`} fill sizes="56px" className="object-contain p-1" />
                                          <span
                                            className={`absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-white transition-colors ${
                                              isSelectedFont ? 'bg-primary' : 'bg-border'
                                            }`}
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Row 2: Name and Number inputs */}
                                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/60">
                                  <div>
                                    <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1">
                                      Name
                                    </label>
                                    <input
                                      value={state.name}
                                      onChange={(e) => updateItem(id, { name: e.target.value.toUpperCase() })}
                                      placeholder="PLAYER NAME"
                                      maxLength={14}
                                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text outline-none transition-colors focus:border-primary"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1">
                                      Number
                                    </label>
                                    <input
                                      value={state.number}
                                      onChange={(e) => updateItem(id, { number: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                                      inputMode="numeric"
                                      placeholder="10"
                                      maxLength={2}
                                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text outline-none transition-colors focus:border-primary"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Patch Details Part (When Patch Switch is ON) */}
                      <AnimatePresence initial={false}>
                        {state.patchEnabled && hasPatch && (
                          <motion.div
                            key="patch-drawer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: IOS_EASE }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3.5">
                              <div className="rounded-2xl border border-border bg-white p-4">
                                <div className="mb-2.5 flex items-center justify-between">
                                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Select Patches (Multiple choice)
                                  </span>
                                  {state.selectedPatches?.length > 0 && (
                                    <span className="text-xs font-bold text-primary">
                                      +{formatPrice(
                                        state.selectedPatches.reduce((sum, p) => sum + (Number(p?.price) || 0), 0)
                                      )}৳
                                    </span>
                                  )}
                                </div>

                                {/* Patch images */}
                                <div className="flex flex-wrap gap-2.5">
                                  {product.patchsImg.map((entry, idx) => {
                                    const option = typeof entry === 'string' ? { image: entry, price: 0 } : entry;
                                    const src = option.image;
                                    const isSelectedPatch = state.selectedPatches?.some((p) => (typeof p === 'string' ? p : p.image) === src);

                                    return (
                                      <div key={src + idx} className="text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const cur = state.selectedPatches || [];
                                            const next = isSelectedPatch
                                              ? cur.filter((p) => (typeof p === 'string' ? p : p.image) !== src)
                                              : [...cur, option];
                                            updateItem(id, { selectedPatches: next });
                                          }}
                                          className={`group relative h-14 w-14 cursor-pointer overflow-hidden rounded-xl border-2 p-1 transition-all ${
                                            isSelectedPatch
                                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                              : 'border-border bg-surface hover:border-primary/40'
                                          }`}
                                        >
                                          <Image src={src} alt={`Patch ${idx + 1}`} fill sizes="56px" className="rounded-lg object-cover" />
                                          <span
                                            className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded border border-white text-[10px] transition-colors ${
                                              isSelectedPatch ? 'bg-primary text-white' : 'bg-white/80 text-transparent'
                                            }`}
                                          >
                                            <Check size={10} strokeWidth={3} />
                                          </span>
                                        </button>
                                        {Number(option.price) > 0 && (
                                          <span className="mt-1 block text-[10px] font-semibold text-text-muted">
                                            +{formatPrice(option.price)}৳
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="text-base font-semibold text-text">No products match your search</p>
            <p className="mt-1 text-sm text-text-muted">Try typing a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
