'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Plus, Save, Shirt, ShoppingBag, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DateInput from '@/components/dashboard/DateInput';
import AnimatedSelect from '@/components/dashboard/products/AnimatedSelect';
import IOSSwitch from '@/components/dashboard/products/IOSSwitch';
import SelectedProductModal from '@/components/dashboard/orders/SelectedProductModal';
import { createManualOrder, parseOrderText, updateOrder } from '@/lib/api/requests/staffOrders';
import { todayInDhaka } from '@/lib/admin/dates';
import { ACCOUNTS, SOURCES } from '@/lib/orders/constants';
import { formatPrice } from '@/lib/format';

const IOS_EASE = [0.32, 0.72, 0, 1];

const inputClass = 'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary';
const triggerClass = 'flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm text-text outline-none';
const cardClass = 'relative rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8';
const h2Class = 'text-sm font-semibold uppercase tracking-wide text-text-muted';
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted';

const SOURCE_OPTIONS = SOURCES.map((s) => ({ value: s, label: s }));
const ACCOUNT_OPTIONS = ACCOUNTS.map((a) => ({ value: a, label: a }));

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

function getInitialFormState(order, defaultAssignee, isWebsite, isEdit) {
  const base = {
    date: order?.date ?? todayInDhaka(),
    customerName: order?.customerName ?? '',
    phone: order?.phone ?? '',
    phone2: order?.phone2 ?? '',
    address: order?.address ?? '',
    items: order?.items ? order.items : [],
    cod: order && !isWebsite ? String(order.cod || '') : '',
    advance: order?.advance ? String(order.advance) : '',
    advanceAccount: order?.advanceAccount ?? '',
    note: order?.note ?? '',
    source: order?.source ?? 'Facebook',
    assigneeId: defaultAssignee,
    sendToCourier: true,
  };

  if (typeof window === 'undefined' || isEdit) return base;

  try {
    const draft = sessionStorage.getItem('nique_order_draft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      Object.assign(base, parsedDraft);
    }

    const savedProducts = sessionStorage.getItem('nique_selected_products');
    if (savedProducts) {
      const parsedItems = JSON.parse(savedProducts);
      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        base.items = parsedItems;
        const itemsSubtotal = parsedItems.reduce(
          (s, it) => s + (Number(it.lineTotal) || Number(it.unitPrice) * (Number(it.quantity) || 1) || Number(it.basePrice) || 0),
          0
        );
        const adv = Number(base.advance) || 0;
        if (!base.cod || Number(base.cod) === 0) {
          base.cod = String(Math.max(0, itemsSubtotal - adv));
        }
      }
    }
  } catch {
    // Ignore storage parse errors
  }

  return base;
}

export default function OrderForm({ mode, order, assignees, defaultAssignee, canPickAssignee, aiEnabled, courierEnabled }) {
  const router = useRouter();
  const nextId = useRef(100);
  const isEdit = mode === 'edit';
  const isWebsite = Boolean(order?.isWebsite);

  const [f, setF] = useState(() => getInitialFormState(order, defaultAssignee, isWebsite, isEdit));
  const [saving, setSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const advance = Number(f.advance) || 0;
  // website orders have a fixed total; manual orders: COD is typed or calculated
  const cod = isWebsite ? Math.max(0, (order?.total ?? 0) - advance) : Number(f.cod) || 0;
  const total = isWebsite ? order.total : cod + advance;

  async function runAi() {
    setAiBusy(true);
    const res = await parseOrderText(aiText);
    setAiBusy(false);
    if (!res.success) return toast.error(res.error);
    const d = res.data;
    setF((p) => ({
      ...p,
      customerName: d.customerName || p.customerName,
      phone: d.phone || p.phone,
      address: d.address || p.address,
      items: d.items?.length ? d.items.map((i) => ({ id: nextId.current++, ...i })) : p.items,
      cod: d.cod ? String(d.cod) : p.cod,
      advance: d.advance ? String(d.advance) : p.advance,
      note: d.note || p.note,
    }));
    toast.success('Filled by AI. Check everything, then save.');
  }

  const navigateToSelectProduct = () => {
    try {
      sessionStorage.setItem('nique_order_draft', JSON.stringify(f));
    } catch (err) {
      console.error('Failed to save draft to sessionStorage:', err);
    }
    router.push('/dashboard/orders/add/select-product');
  };

  async function submit(e, confirmDuplicate = false) {
    e?.preventDefault();
    if (saving) return;

    if (!isWebsite && (!f.items || f.items.length === 0)) {
      toast.error('Please select at least one product.');
      return;
    }

    setSaving(true);

    const payload = {
      date: f.date,
      customerName: f.customerName,
      phone: f.phone,
      phone2: f.phone2,
      address: f.address,
      items: isWebsite ? order.items.map((i) => ({ title: i.title, size: i.size, quantity: i.quantity, note: '' })) : f.items,
      cod,
      advance,
      advanceAccount: advance > 0 ? f.advanceAccount : '',
      note: f.note,
      source: f.source,
      assigneeId: f.assigneeId,
      sendToCourier: f.sendToCourier,
    };

    try {
      const res = isEdit ? await updateOrder(order.id, payload) : await createManualOrder(payload, { confirmDuplicate });

      if (res.duplicate) {
        setSaving(false);
        if (window.confirm(`${res.error}\n\nCreate another order for the same number anyway?`)) return submit(null, true);
        return;
      }
      if (!res.success) {
        toast.error(res.error);
        setSaving(false);
        return;
      }

      // Clear draft on successful creation
      try {
        sessionStorage.removeItem('nique_order_draft');
        sessionStorage.removeItem('nique_selected_products');
      } catch {}

      if (isEdit) toast.success(res.courierWarning ? 'Saved. Note: it was already sent to Steadfast, the courier still has the old details.' : 'Order updated.');
      else if (res.courier && !res.courier.ok) toast.error(`Order saved, but Steadfast failed: ${res.courier.error}`);
      else toast.success(res.courier?.ok ? 'Order saved and sent to Steadfast.' : 'Order saved.');

      router.push('/dashboard/orders');
      router.refresh();
    } catch {
      toast.error('Network or server error occurred.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {aiEnabled && !isEdit && (
        <section className={cardClass}>
          <h2 className={`${h2Class} flex items-center gap-2`}><Sparkles size={15} className="text-primary" />AI entry</h2>
          <p className="mt-1 text-xs text-text-muted">Paste the customer&apos;s message (Bangla or English) and let AI fill the form.</p>
          <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={4} maxLength={4000} placeholder="নাম: ... ফোন: 01... ঠিকানা: ... Argentina away retro XL ..." className={`${inputClass} mt-3 resize-y`} />
          <button type="button" onClick={runAi} disabled={aiBusy || aiText.trim().length < 8} className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
            {aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiBusy ? 'Reading…' : 'Fill with AI'}
          </button>
        </section>
      )}

      {/* Customer Section */}
      <section className={`${cardClass} z-30`}>
        <h2 className={h2Class}>Customer</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2"><input value={f.customerName} onChange={(e) => set('customerName', e.target.value)} maxLength={100} placeholder="Customer name" className={inputClass} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" maxLength={14} placeholder="01XXXXXXXXX" className={inputClass} /></Field>
          <Field label="Phone 2 (optional)"><input value={f.phone2} onChange={(e) => set('phone2', e.target.value)} inputMode="tel" maxLength={14} placeholder="Alternate number" className={inputClass} /></Field>
          <Field label="Delivery address" className="sm:col-span-2"><textarea value={f.address} onChange={(e) => set('address', e.target.value)} rows={3} maxLength={500} placeholder="House, road, area, thana, district" className={`${inputClass} resize-y`} /></Field>
        </div>
      </section>

      {/* Select Product Section */}
      <section className={`${cardClass} z-20`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className={h2Class}>Select product</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {f.items.length > 0
                ? `${f.items.length} ${f.items.length === 1 ? 'product' : 'products'} selected. Click an image to view details.`
                : 'Select jerseys or apparel to add to this order.'}
            </p>
          </div>
          {!isWebsite && (
            <button
              type="button"
              onClick={navigateToSelectProduct}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark active:scale-95"
            >
              <ShoppingBag size={15} />
              {f.items.length > 0 ? 'Change products' : 'Select products'}
            </button>
          )}
        </div>

        {f.items.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {f.items.map((item, idx) => (
                <motion.div
                  layout
                  key={item.productId ? `${item.productId}-${item.size || 'std'}-${idx}` : idx}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.22, ease: 'easeOut' } }}
                  transition={{ layout: { duration: 0.28, ease: IOS_EASE } }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-2.5 transition-colors hover:border-primary/40"
                >
                  {/* Clicking on the product image opens the modal with product info */}
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    aria-label={`View details for ${item.title}`}
                    className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-white"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <Shirt size={28} />
                      </div>
                    )}
                    {item.size && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {item.size}
                      </span>
                    )}
                  </button>

                  {/* Info */}
                  <div className="mt-2 min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-xs font-semibold text-text" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">
                        {formatPrice(item.lineTotal || item.unitPrice || item.basePrice || 0)}৳
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[11px] text-text-muted">×{item.quantity}</span>
                      )}
                    </div>
                  </div>

                  {/* Remove button: always visible on mobile, hover on desktop */}
                  {!isWebsite && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = f.items.filter((_, i) => i !== idx);
                        set('items', updated);
                        try {
                          sessionStorage.setItem('nique_selected_products', JSON.stringify(updated));
                        } catch {}
                      }}
                      aria-label={`Remove ${item.title}`}
                      className="absolute right-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-border/80 bg-white/95 text-text-muted shadow-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 hover:text-danger active:scale-90"
                    >
                      <X size={13} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div
            onClick={navigateToSelectProduct}
            className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface/50 p-8 text-center transition-all duration-200 hover:border-primary/40 hover:bg-surface active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingBag size={22} />
            </div>
            <p className="mt-3 text-sm font-semibold text-text">No products selected yet</p>
            <p className="mt-1 text-xs text-text-muted">Click here to browse catalog and select products</p>
          </div>
        )}
      </section>

      {/* Payment Section */}
      <section className={`${cardClass} z-10`}>
        <h2 className={h2Class}>Payment</h2>
        <div className="mt-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {isWebsite ? (
              <Field label="COD (collect on delivery)"><p className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-text">{formatPrice(cod)}৳</p></Field>
            ) : (
              <Field label="COD, collect on delivery (৳)"><input value={f.cod} onChange={(e) => set('cod', e.target.value)} type="number" min="0" inputMode="decimal" placeholder="700" className={inputClass} /></Field>
            )}
            <Field label="Advance already paid (৳)"><input value={f.advance} onChange={(e) => set('advance', e.target.value)} type="number" min="0" inputMode="decimal" placeholder="0 = no advance" className={inputClass} /></Field>
          </div>

          <AnimatePresence initial={false}>
            {advance > 0 && (
              <motion.div
                key="advance-account-field"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                transition={{ duration: 0.32, ease: IOS_EASE }}
                style={{ overflow: 'hidden' }}
              >
                <div className="pt-5">
                  <Field label="Advance received in">
                    <AnimatedSelect
                      id="advance-account"
                      options={ACCOUNT_OPTIONS}
                      value={f.advanceAccount}
                      onChange={(v) => set('advanceAccount', v)}
                      placeholder="Choose account"
                      triggerLabel="Advance account"
                      className="w-full"
                      triggerClassName={triggerClass}
                    />
                    <p className="mt-1.5 text-xs text-text-muted">This is saved as &quot;Money in&quot; to that account in Finance.</p>
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-sm text-text-muted">Order total: <span className="font-semibold text-text">{formatPrice(total)}৳</span></p>
      </section>

      {/* Order Info Section */}
      <section className={`${cardClass} z-1`}>
        <h2 className={h2Class}>Order info</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DateInput label="Order date" value={f.date} onChange={(v) => set('date', v)} required />
          <Field label="Source"><AnimatedSelect id="source" options={SOURCE_OPTIONS} value={f.source} onChange={(v) => set('source', v)} triggerLabel="Source" className="w-full" triggerClassName={triggerClass} /></Field>
          {canPickAssignee && (
            <Field label="By whom" className="sm:col-span-2">
              <AnimatedSelect id="by-whom" options={assignees} value={f.assigneeId} onChange={(v) => set('assigneeId', v)} triggerLabel="By whom" className="w-full" triggerClassName={triggerClass} />
            </Field>
          )}
          <Field label="Note for the courier (optional)" className="sm:col-span-2"><textarea value={f.note} onChange={(e) => set('note', e.target.value)} rows={2} maxLength={1000} placeholder="e.g. Delivery charge advance kora ache" className={`${inputClass} resize-y`} /></Field>
        </div>
        {!isEdit && courierEnabled && (
          <div className="mt-5 border-t border-border pt-4">
            <IOSSwitch label="Send to Steadfast" description="Creates the parcel right after saving" checked={f.sendToCourier} onChange={(v) => set('sendToCourier', v)} />
          </div>
        )}
      </section>

      <button type="submit" disabled={saving} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 sm:w-auto sm:px-10">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add order'}
      </button>

      {/* Product Information Modal (Root Level) */}
      <SelectedProductModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onRemove={(toRemove) => {
          const updated = f.items.filter((it) => it !== toRemove);
          set('items', updated);
          try {
            sessionStorage.setItem('nique_selected_products', JSON.stringify(updated));
          } catch {}
        }}
      />
    </form>
  );
}
