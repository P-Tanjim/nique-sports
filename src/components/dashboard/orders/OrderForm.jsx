'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Plus, Save, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import DateInput from '@/components/dashboard/DateInput';
import AnimatedSelect from '@/components/dashboard/products/AnimatedSelect';
import IOSSwitch from '@/components/dashboard/products/IOSSwitch';
import { createManualOrder, parseOrderText, updateOrder } from '@/lib/api/requests/staffOrders';
import { todayInDhaka } from '@/lib/admin/dates';
import { ACCOUNTS, SIZES, SOURCES } from '@/lib/orders/constants';
import { formatPrice } from '@/lib/format';

const IOS_EASE = [0.32, 0.72, 0, 1];

const inputClass = 'w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition-colors focus:border-primary';
const triggerClass = 'flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm text-text outline-none';
const cardClass = 'relative rounded-3xl border border-border bg-white/80 p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8';
const h2Class = 'text-sm font-semibold uppercase tracking-wide text-text-muted';
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted';

const SIZE_OPTIONS = [{ value: '', label: 'Size' }, ...SIZES.map((s) => ({ value: s, label: s }))];
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

export default function OrderForm({ mode, order, assignees, defaultAssignee, canPickAssignee, aiEnabled, courierEnabled }) {
  const router = useRouter();
  const nextId = useRef(100);
  const isEdit = mode === 'edit';
  const isWebsite = Boolean(order?.isWebsite);

  const [f, setF] = useState(() => ({
    date: order?.date ?? todayInDhaka(),
    customerName: order?.customerName ?? '',
    phone: order?.phone ?? '',
    phone2: order?.phone2 ?? '',
    address: order?.address ?? '',
    items: order && !isWebsite
      ? order.items.map((i, idx) => ({ id: idx, title: i.title, size: i.size || '', quantity: i.quantity || 1, note: i.note || '' }))
      : [{ id: 0, title: '', size: '', quantity: 1, note: '' }],
    cod: order && !isWebsite ? String(order.cod || '') : '',
    advance: order?.advance ? String(order.advance) : '',
    advanceAccount: order?.advanceAccount ?? '',
    note: order?.note ?? '',
    source: order?.source ?? 'Facebook',
    assigneeId: defaultAssignee,
    sendToCourier: true,
  }));
  const [saving, setSaving] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setItem = (id, patch) => setF((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const advance = Number(f.advance) || 0;
  // website orders have a fixed total; manual orders: COD is typed
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
      items: d.items.length ? d.items.map((i) => ({ id: nextId.current++, ...i })) : p.items,
      cod: d.cod ? String(d.cod) : p.cod,
      advance: d.advance ? String(d.advance) : p.advance,
      note: d.note || p.note,
    }));
    toast.success('Filled by AI. Check everything, then save.');
  }

  async function submit(e, confirmDuplicate = false) {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);

    const payload = {
      date: f.date, customerName: f.customerName, phone: f.phone, phone2: f.phone2, address: f.address,
      items: isWebsite ? order.items.map((i) => ({ title: i.title, size: i.size, quantity: i.quantity, note: '' })) : f.items,
      cod, advance, advanceAccount: advance > 0 ? f.advanceAccount : '',
      note: f.note, source: f.source, assigneeId: f.assigneeId, sendToCourier: f.sendToCourier,
    };

    try {
      const res = isEdit ? await updateOrder(order.id, payload) : await createManualOrder(payload, { confirmDuplicate });

      if (res.duplicate) {
        setSaving(false);
        if (window.confirm(`${res.error}\n\nCreate another order for the same number anyway?`)) return submit(null, true);
        return;
      }
      if (!res.success) { toast.error(res.error); setSaving(false); return; }

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

      <section className={`${cardClass} z-30`}>
        <h2 className={h2Class}>Customer</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2"><input value={f.customerName} onChange={(e) => set('customerName', e.target.value)} maxLength={100} placeholder="Customer name" className={inputClass} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" maxLength={14} placeholder="01XXXXXXXXX" className={inputClass} /></Field>
          <Field label="Phone 2 (optional)"><input value={f.phone2} onChange={(e) => set('phone2', e.target.value)} inputMode="tel" maxLength={14} placeholder="Alternate number" className={inputClass} /></Field>
          <Field label="Delivery address" className="sm:col-span-2"><textarea value={f.address} onChange={(e) => set('address', e.target.value)} rows={3} maxLength={500} placeholder="House, road, area, thana, district" className={`${inputClass} resize-y`} /></Field>
        </div>
      </section>

      <section className={`${cardClass} z-20`}>
        <h2 className={h2Class}>Items</h2>
        {isWebsite ? (
          <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-text-muted">Website order, items and prices are locked: {order.items.map((i) => `${i.title} (${i.size}) x${i.quantity}`).join(', ')}</p>
        ) : (
          <div className="mt-5 space-y-3">
            {f.items.map((it, idx) => (
              <div key={it.id} className="grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-[1fr_110px_80px_auto]">
                <input value={it.title} onChange={(e) => setItem(it.id, { title: e.target.value })} maxLength={150} placeholder={`Item ${idx + 1}: team / season / kit`} aria-label={`Item ${idx + 1} name`} className={inputClass} />
                <AnimatedSelect id={`size-${it.id}`} options={SIZE_OPTIONS} value={it.size} onChange={(v) => setItem(it.id, { size: v })} triggerLabel={`Item ${idx + 1} size`} className="w-full" triggerClassName={triggerClass} />
                <input value={it.quantity} onChange={(e) => setItem(it.id, { quantity: e.target.value })} type="number" min="1" max="50" aria-label={`Item ${idx + 1} quantity`} className={inputClass} />
                {f.items.length > 1 ? (
                  <button type="button" onClick={() => setF((p) => ({ ...p, items: p.items.filter((x) => x.id !== it.id) }))} aria-label={`Remove item ${idx + 1}`} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-text-muted hover:bg-surface hover:text-danger"><X size={16} /></button>
                ) : <span />}
                <input value={it.note} onChange={(e) => setItem(it.id, { note: e.target.value })} maxLength={150} placeholder="Name / number / patch / sleeve (optional)" aria-label={`Item ${idx + 1} note`} className={`${inputClass} sm:col-span-4`} />
              </div>
            ))}
            {f.items.length < 20 && (
              <button type="button" onClick={() => setF((p) => ({ ...p, items: [...p.items, { id: nextId.current++, title: '', size: '', quantity: 1, note: '' }] }))} className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"><Plus size={15} />Add another item</button>
            )}
          </div>
        )}
      </section>

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
    </form>
  );
}
