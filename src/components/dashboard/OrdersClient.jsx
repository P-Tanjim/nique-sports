'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Package, Plus, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderCard from './orders/OrderCard';
import OrderDetailsModal from './orders/OrderDetailsModal';
import AnimatedSelect from './products/AnimatedSelect';
import { fetchAllOrders, setOrderStatus, syncCourier } from '@/lib/api/requests/staffOrders';
import { ORDER_STATUSES } from '@/lib/orders/constants';

const PAGE = 24;
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))];
const withIssue = (o) => ({ ...o, riderIssue: Boolean(o.riderNote) && o.riderResolved !== 'YES' });

export default function OrdersClient({ orders: initial, total, unavailable, isAdmin, userId, canSync, templates }) {
  const [orders, setOrders] = useState(initial);
  const [hasAll, setHasAll] = useState(initial.length >= total);
  const [loadingAll, setLoadingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [who, setWho] = useState('');
  const [riderOnly, setRiderOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  // update one order in local state (after an action) without refetching
  const patchLocal = (id, patch) => setOrders((cur) => cur.map((o) => (o.id === id ? withIssue({ ...o, ...patch }) : o)));

  async function runSync(force) {
    setSyncing(true);
    const res = await syncCourier({ force });
    setSyncing(false);
    if (!res.success) { if (force) toast.error(res.error); return; }
    if (res.orders.length) {
      const map = new Map(res.orders.map((o) => [o.id, o]));
      setOrders((cur) => cur.map((o) => (map.has(o.id) ? withIssue({ ...o, ...map.get(o.id) }) : o)));
      if (force) toast.success(`${res.orders.length} order(s) updated from Steadfast.`);
    } else if (force) toast.success('Everything is up to date.');
  }

  // the server throttles this, so opening the page often is cheap
  useEffect(() => { if (canSync) runSync(false); }, [canSync]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoadingAll(true);
    const res = await fetchAllOrders();
    setLoadingAll(false);
    if (!res.success) return toast.error(res.error);
    setOrders(res.orders);
    setHasAll(true);
  }

  async function changeStatus(order, next) {
    setSavingId(order.id);
    const res = await setOrderStatus(order.id, next);
    setSavingId(null);
    if (!res.success) return toast.error(res.error);
    patchLocal(order.id, res.patch);
    toast.success(`Marked ${next}.`);
  }

  const whoOptions = useMemo(() => {
    const names = [...new Set(orders.map((o) => o.addedBy || 'website'))].sort();
    return [{ value: '', label: 'Everyone' }, ...names.map((n) => ({ value: n, label: n }))];
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (who && (o.addedBy || 'website') !== who) return false;
      if (riderOnly && !o.riderIssue) return false;
      if (!q) return true;
      return [o.customerName, o.phone, o.phone2, o.orderNo, o.courierId, o.trackingCode, o.items.map((i) => i.title).join(' '), o.address]
        .some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [orders, query, status, who, riderOnly]);

  const issueCount = orders.filter((o) => o.riderIssue).length;
  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const shown = filtered.slice(0, limit);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">{isAdmin ? 'All orders' : 'My orders'}</h1>
          <p className="mt-1 text-sm text-text-muted">{total} {total === 1 ? 'order' : 'orders'}</p>
        </div>
        <div className="flex items-center gap-2">
          {canSync && (
            <button type="button" onClick={() => runSync(true)} disabled={syncing} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface disabled:opacity-60">
              {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync courier'}</span>
            </button>
          )}
          <Link href="/dashboard/orders/add" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
            <Plus size={16} />Add order
          </Link>
        </div>
      </header>

      <section className="grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_auto]">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="Search name, phone, order no, courier id…" className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text outline-none focus:border-primary" />
        </label>
        <AnimatedSelect id="f-status" options={STATUS_OPTIONS} value={status} onChange={(v) => { setStatus(v); setLimit(PAGE); }} triggerLabel="Status filter" className="w-full" triggerClassName="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm text-text outline-none" />
        {isAdmin ? (
          <AnimatedSelect id="f-who" options={whoOptions} value={who} onChange={(v) => { setWho(v); setLimit(PAGE); }} triggerLabel="By whom filter" className="w-full" triggerClassName="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm text-text outline-none" />
        ) : <div className="hidden lg:block" />}
        <button type="button" onClick={() => { setRiderOnly((v) => !v); setLimit(PAGE); }} className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${riderOnly ? 'border-danger bg-danger/10 text-danger' : 'border-border bg-surface text-text-muted hover:text-text'}`}>
          <AlertTriangle size={15} />Rider issues{issueCount ? ` (${issueCount})` : ''}
        </button>
      </section>

      {shown.length ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((order) => (
              <OrderCard key={order.id} order={order} isAdmin={isAdmin} saving={savingId === order.id} onSelect={() => setSelectedId(order.id)} onStatus={changeStatus} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {filtered.length > limit && (
              <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="cursor-pointer rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-text hover:bg-surface">Show more ({filtered.length - limit})</button>
            )}
            {!hasAll && (
              <button type="button" onClick={loadAll} disabled={loadingAll} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-text-muted hover:bg-surface disabled:opacity-60">
                {loadingAll && <Loader2 size={14} className="animate-spin" />}Load older orders
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <Package className="mx-auto text-text-muted" size={30} strokeWidth={1.5} />
          <h2 className="mt-3 text-base font-semibold text-text">{unavailable ? 'Orders could not be loaded' : orders.length ? 'No orders match these filters' : 'No orders yet'}</h2>
          <p className="mt-1 text-sm text-text-muted">{unavailable ? 'Check the Google Sheet env vars and that the sheet is shared with the service account.' : orders.length ? 'Try clearing the search or filters.' : 'New orders will appear here.'}</p>
        </div>
      )}

      {selected && (
        <OrderDetailsModal order={selected} isAdmin={isAdmin} userId={userId} templates={templates} onPatch={patchLocal} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
