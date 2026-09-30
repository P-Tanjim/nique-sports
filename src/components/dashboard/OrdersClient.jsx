'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Package, Phone, X } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import { formatPrice } from '@/lib/format';

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

function getProduct(item) {
  return item?.product ?? item?.productDetails ??
    (typeof item?.productId === 'object' ? item.productId : {}) ?? {};
}

function imageUrl(image) {
  if (typeof image === 'string') return image;
  return image?.url ?? image?.image ?? image?.src ?? image?.secure_url ?? '';
}

function getProductImages(item) {
  const product = getProduct(item);
  const candidates = [
    ...(Array.isArray(item?.images) ? item.images : []),
    item?.image,
    item?.productImage,
    ...(Array.isArray(product?.imagesLink) ? product.imagesLink : []),
    ...(Array.isArray(product?.images) ? product.images : []),
    product?.image,
    product?.thumbnail,
  ];

  return [...new Set(candidates.map(imageUrl).filter(Boolean))];
}

function getCustomer(order) {
  return typeof order?.customer === 'object' && order.customer !== null
    ? order.customer
    : {};
}

function getCustomerName(order) {
  const customer = getCustomer(order);
  return customer.name ?? order?.customerName ?? order?.name ??
    (typeof order?.customer === 'string' ? order.customer : '') ?? 'Customer';
}

function getPhone(order) {
  const customer = getCustomer(order);
  return customer.phone ?? customer.number ?? order?.phone ?? order?.phoneNumber ?? order?.number ?? '';
}

function getAddress(order) {
  const customer = getCustomer(order);
  const address = customer.address ?? order?.address ?? order?.shippingAddress ?? order?.deliveryAddress;
  if (typeof address === 'string') return address;
  if (address && typeof address === 'object') {
    return [address.line1, address.line2, address.area, address.city, address.district, address.postalCode]
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

function getOrderId(order, index = 0) {
  return order?._id ?? order?.id ?? order?.orderId ?? `order-${index + 1}`;
}

function getItemName(item) {
  const product = getProduct(item);
  return item?.title ?? item?.productName ?? item?.name ?? product?.title ?? product?.name ??
    (typeof item?.productId === 'string' ? item.productId : 'Product');
}

function getOrderImages(order) {
  return getOrderItems(order).flatMap(getProductImages);
}

function getSizeSummary(order) {
  const sizes = getOrderItems(order).map((item) => item?.size).filter(Boolean);
  return sizes.length ? sizes.join(', ') : 'Not provided';
}

function getOrderDate(order) {
  const date = order?.createdAt ?? order?.date ?? order?.created_at;
  if (!date) return '';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? String(date)
    : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function ImageGrid({ images, className = '' }) {
  const visibleImages = images.slice(0, 4);
  const gridShape = visibleImages.length === 1
    ? 'grid-cols-1 grid-rows-1'
    : 'grid-cols-2 grid-rows-2';

  if (!visibleImages.length) {
    return (
      <div className={`flex aspect-square items-center justify-center bg-[#e8eee8] text-[#64786a] ${className}`}>
        <Package size={34} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={`grid aspect-square overflow-hidden bg-[#e8eee8] ${gridShape} ${className}`}>
      {visibleImages.map((src, index) => {
        const isSingle = visibleImages.length === 1;
        const isThird = visibleImages.length === 3 && index === 0;
        const hasOverflow = index === 3 && images.length > 4;

        return (
          <div
            key={`${src}-${index}`}
            className={`relative min-h-0 min-w-0 overflow-hidden ${isSingle ? 'row-span-2' : ''} ${isThird ? 'row-span-2' : ''}`}
          >
            <Image src={src} alt="Ordered product" fill unoptimized sizes="(max-width: 640px) 100vw, 360px" className="object-cover" />
            {hasOverflow && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white">
                +{images.length - 4}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailImages({ images, label }) {
  if (!images.length) return <span className="text-xs text-[#737c76]">None selected</span>;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((src, index) => (
        <div key={`${src}-${index}`} className="relative h-14 w-14 overflow-hidden rounded-md border border-[#dfe5df] bg-white">
          <Image src={src} alt={label} fill unoptimized sizes="56px" className="object-contain p-1" />
        </div>
      ))}
    </div>
  );
}

function getFontImage(customization) {
  const font = customization?.font;
  return imageUrl(customization?.fontImage ?? font?.image ?? font?.url ?? font);
}

function getPatches(item) {
  const patches = item?.patches ?? item?.patch ?? [];
  return (Array.isArray(patches) ? patches : [patches]).map(imageUrl).filter(Boolean);
}

function OrderDetailsModal({ order, onClose }) {
  const customer = getCustomer(order);
  const items = getOrderItems(order);
  const status = String(order?.status ?? 'pending').toLowerCase();
  const secondaryPhone = customer.phone2 ?? order?.phone2;

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17221d]/55 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="max-h-[calc(100dvh-24px)] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#dfe5df] bg-[#fbfcfa] shadow-2xl sm:max-h-[calc(100dvh-48px)]"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#e4e9e3] bg-[#fbfcfa]/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="order-detail-title" className="text-lg font-semibold text-[#1b2921]">Order details</h2>
              <OrderStatusBadge status={status} />
            </div>
            <p className="mt-1 truncate text-xs text-[#737c76]">Order {getOrderId(order)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close order details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#59645d] transition-colors hover:bg-[#edf1ec]">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
          <section>
            <h3 className="text-sm font-semibold text-[#1b2921]">Customer</h3>
            <div className="mt-3 grid gap-3 rounded-lg border border-[#e3e8e2] bg-white p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#737c76]">Name</p>
                <p className="mt-1 text-sm font-medium text-[#1b2921]">{getCustomerName(order)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#737c76]">Phone</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-[#1b2921]"><Phone size={14} />{getPhone(order) || 'Not provided'}</p>
                {secondaryPhone && <p className="mt-1 text-xs text-[#737c76]">Alternate: {secondaryPhone}</p>}
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#737c76]">Address</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-[#1b2921]"><MapPin className="mt-0.5 shrink-0" size={14} />{getAddress(order) || 'Not provided'}</p>
                {(order?.deliveryArea || customer.deliveryArea) && <p className="mt-1 pl-5 text-xs text-[#737c76]">Delivery: {order?.deliveryArea ?? customer.deliveryArea}</p>}
              </div>
              {(order?.note || customer.note) && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#737c76]">Order note</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#1b2921]">{order?.note ?? customer.note}</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#1b2921]">Products</h3>
              <span className="text-xs text-[#737c76]">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            </div>
            {items.length ? (
              <div className="mt-3 space-y-3">
                {items.map((item, index) => {
                  const customization = item?.customization ?? {};
                  const font = item?.font ?? customization?.font;
                  const fontName = typeof font === 'object' ? font?.name : '';
                  const fontImage = getFontImage({ ...customization, font });
                  const patches = getPatches(item);

                  return (
                    <article key={`${getOrderId(order)}-${index}`} className="rounded-lg border border-[#e3e8e2] bg-white p-4">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="w-full shrink-0 sm:w-44">
                          <ImageGrid images={getProductImages(item)} className="rounded-md" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[#1b2921]">{getItemName(item)}</h4>
                          <p className="mt-1 text-xs text-[#737c76]">
                            Qty: {item?.quantity ?? 1} <span className="px-1">·</span> Size: {item?.size ?? 'Not provided'}
                          </p>
                          {(item?.price != null || item?.unitPrice != null) && (
                            <p className="mt-1 text-xs text-[#737c76]">Unit price: {formatPrice(Number(item.price ?? item.unitPrice) || 0)}৳</p>
                          )}
                          {item?.lineTotal != null && (
                            <p className="mt-1 text-xs text-[#737c76]">Line total: {formatPrice(Number(item.lineTotal) || 0)}৳</p>
                          )}
                          <div className="mt-4 grid gap-4 border-t border-[#edf0ec] pt-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold text-[#37433b]">Font</p>
                              <DetailImages images={fontImage ? [fontImage] : []} label="Selected font" />
                              {fontName && <p className="mt-1 text-xs text-[#737c76]">{fontName}</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#37433b]">Customization</p>
                              <p className="mt-2 text-xs text-[#59645d]">Name: {customization.name || 'None'}</p>
                              <p className="mt-1 text-xs text-[#59645d]">Number: {customization.number || 'None'}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold text-[#37433b]">Patches</p>
                              <DetailImages images={patches} label="Selected patch" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-[#dfe5df] p-5 text-center text-sm text-[#737c76]">No product details were returned for this order.</p>
            )}
          </section>

          <section className="space-y-2 border-t border-[#e3e8e2] pt-4 text-sm">
            <p className="flex items-center gap-2 text-[#59645d]"><CalendarDays size={15} />{getOrderDate(order) || 'Date not provided'}</p>
            {order?.paymentMethod && <p className="text-[#59645d]">Payment: {order.paymentMethod}</p>}
            {order?.subtotal != null && (
              <p className="flex justify-between gap-4 text-[#59645d]"><span>Subtotal</span><span>{formatPrice(Number(order.subtotal) || 0)}৳</span></p>
            )}
            {order?.deliveryFee != null && (
              <p className="flex justify-between gap-4 text-[#59645d]"><span>Delivery fee</span><span>{formatPrice(Number(order.deliveryFee) || 0)}৳</span></p>
            )}
            {order?.total != null || order?.amount != null ? (
              <p className="flex justify-between gap-4 border-t border-[#edf0ec] pt-2 font-semibold text-[#1b2921]"><span>Total</span><span>{formatPrice(Number(order.total ?? order.amount) || 0)}৳</span></p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}

function OrderCard({ order, index, onSelect }) {
  const images = getOrderImages(order);
  const status = String(order?.status ?? 'pending').toLowerCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#dfe5df] bg-white text-left shadow-[0_2px_8px_rgba(29,47,35,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b9c8bb] hover:shadow-[0_8px_24px_rgba(29,47,35,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34865b] focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="truncate text-xs font-semibold text-[#435149]">{getOrderId(order, index)}</span>
        <OrderStatusBadge status={status} />
      </div>
      <ImageGrid images={images} className="w-full transition-transform duration-300 group-hover:scale-[1.01]" />
      <div className="space-y-2.5 p-4">
        <p className="truncate text-base font-semibold text-[#1b2921]">{getCustomerName(order)}</p>
        <p className="flex items-center gap-2 text-sm text-[#435149]"><Phone size={14} className="shrink-0 text-[#76827a]" />{getPhone(order) || 'Phone not provided'}</p>
        <p className="flex items-start gap-2 text-sm leading-5 text-[#59645d]">
          <MapPin size={14} className="mt-0.5 shrink-0 text-[#76827a]" />
          <span className="line-clamp-2">{getAddress(order) || 'Address not provided'}</span>
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-[#edf0ec] pt-2.5 text-xs text-[#737c76]">
          <span className="truncate">Size: {getSizeSummary(order)}</span>
          <span className="shrink-0">{getOrderItems(order).length} {getOrderItems(order).length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>
    </button>
  );
}

export default function OrdersClient({ orders, unavailable }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-1 py-2 sm:px-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64806c]">Order management</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1b2921] sm:text-3xl">All orders</h1>
        </div>
        <p className="text-sm text-[#737c76]">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
      </header>

      {orders.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order, index) => (
            <OrderCard
              key={getOrderId(order, index)}
              order={order}
              index={index}
              onSelect={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#cfd9d0] bg-white px-6 py-16 text-center">
          <Package className="mx-auto text-[#819187]" size={30} strokeWidth={1.5} />
          <h2 className="mt-3 text-base font-semibold text-[#1b2921]">
            {unavailable ? 'Orders could not be loaded' : 'No orders yet'}
          </h2>
          <p className="mt-1 text-sm text-[#737c76]">
            {unavailable ? 'Check that the admin orders endpoint is available, then reload this page.' : 'New customer orders will appear here.'}
          </p>
        </div>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </main>
  );
}