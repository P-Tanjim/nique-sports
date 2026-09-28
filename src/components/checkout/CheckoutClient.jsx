// →  src/app/checkout/CheckoutClient.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, Loader2, ShoppingBag } from 'lucide-react';
import { CART_STORAGE_KEY, CART_UPDATED_EVENT, mergeCartItems, readCart } from '@/components/sideCart/SideCart';
import { DELIVERY_OPTIONS, getCartSubtotal, getDeliveryFee, getDeliveryLabel } from '@/lib/checkout/pricing';
import { submitOrder } from '@/lib/api/requests/orders';
import CheckoutForm from './CheckoutForm';
import ProductTabPanel from './ProductTabPanel';
import OrderSummary from './OrderSummary';
import CheckoutBottomSheet from './CheckoutBottomSheet';

const INITIAL_CUSTOMER = {
  name: '',
  address: '',
  phone: '',
  phone2: '',
  note: '',
  deliveryArea: DELIVERY_OPTIONS[0].value,
};

// SideCart.jsx keeps its own writeCart private, so this is the same few
// lines here: save, then fire the same event so the navbar/side cart stay
// in sync with whatever changed on this page.
function writeCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  } catch {
    // storage unavailable — non-fatal, the order itself still submits fine
  }
}

function getOptionPrice(option) {
  if (Array.isArray(option)) return option.reduce((total, entry) => total + getOptionPrice(entry), 0);
  return typeof option === 'string' ? 0 : Number(option?.price) || 0;
}

function PlaceOrderButton({ submitting, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {submitting && <Loader2 size={17} className="animate-spin" />}
      {submitting ? 'Placing order…' : children}
    </button>
  );
}

export default function CheckoutClient() {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState([]);
  const [emptyCartReady, setEmptyCartReady] = useState(false);
  const [customer, setCustomer] = useState(INITIAL_CUSTOMER);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null); // { orderId } | null
  const emptyCartTimerRef = useRef(null);

  // localStorage only exists in the browser, so the cart is read once here
  // after mount — same approach SideCart.jsx takes.
  useEffect(() => {
    const initialItems = readCart();
    setItems(initialItems);
    setEmptyCartReady(initialItems.length === 0);
    setHydrated(true);
  }, []);

  useEffect(() => () => window.clearTimeout(emptyCartTimerRef.current), []);

  const deliveryFee = getDeliveryFee(customer.deliveryArea);
  const deliveryLabel = getDeliveryLabel(customer.deliveryArea);
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const total = subtotal + deliveryFee;
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    [items]
  );

  function updateCustomer(field, value) {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function changeItemSize(index, size) {
    const changedItems = items.map((item, i) => (i === index ? { ...item, size } : item));
    const next = mergeCartItems(changedItems, changedItems[index]);
    setItems(next);
    writeCart(next); // persist so a refresh mid-checkout keeps the change
  }

  function removeCheckoutItem(index) {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(next);
    writeCart(next);
    if (next.length === 0) {
      window.clearTimeout(emptyCartTimerRef.current);
      emptyCartTimerRef.current = window.setTimeout(() => setEmptyCartReady(true), 350);
    }
  }

  function changeItemCustomization(index, customization) {
    const next = items.map((item, i) => {
      if (i !== index) return item;

      const currentFontPrice = Number(item.customization?.font?.price) || 0;
      const nextFontPrice = Number(customization.font?.price) || 0;
      const priceDelta = nextFontPrice - currentFontPrice;
      const updated = {
        ...item,
        customization,
        price: (Number(item.price) || 0) + priceDelta,
      };

      if (item.originalPrice != null) {
        updated.originalPrice = (Number(item.originalPrice) || 0) + priceDelta;
      }

      return updated;
    });
    setItems(next);
    writeCart(next);
  }

  function changeItemPatches(index, patches) {
    const next = items.map((item, i) => {
      if (i !== index) return item;

      const priceDelta = getOptionPrice(patches) - getOptionPrice(item.patch);
      const updated = {
        ...item,
        patch: patches,
        price: (Number(item.price) || 0) + priceDelta,
      };

      if (item.originalPrice != null) {
        updated.originalPrice = (Number(item.originalPrice) || 0) + priceDelta;
      }

      return updated;
    });
    setItems(next);
    writeCart(next);
  }

  function validate() {
    const nextErrors = {};
    if (!customer.name.trim()) nextErrors.name = 'Please enter your name.';
    if (!customer.address.trim()) nextErrors.address = 'Please enter your delivery address.';
    if (!/^01[3-9]\d{8}$/.test(customer.phone.trim())) {
      nextErrors.phone = 'Enter a valid 11-digit number, e.g. 01812345678.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handlePlaceOrder() {
    if (submitting || !items.length) return;

    if (items.some((item) => !String(item.size ?? '').trim())) {
      toast.error('Please select a size for each jersey before checkout.');
      document.querySelector('[data-checkout-products]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!validate()) {
      toast.error('Please check the highlighted fields.');
      setShake(false);
      requestAnimationFrame(() => setShake(true));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitOrder({
        customer,
        items,
        deliveryArea: customer.deliveryArea,
      });

      if (!result?.success) {
        toast.error(result?.error || 'Could not place your order. Please try again.');
        return;
      }

      writeCart([]); // order is in — empty the cart
      setItems([]);
      setPlacedOrder({ orderId: result.orderId });
    } catch (error) {
      console.error('Checkout submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) return null;

  if (placedOrder) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-text">Order placed</h1>
        <p className="mt-2 text-sm text-text-muted">
          Your order <span className="font-semibold text-text">{placedOrder.orderId}</span> is
          confirmed. Pay in cash when it arrives — we&apos;ll call you to confirm the delivery.
        </p>
        <Link
          href="/shop"
          className="mt-8 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0 && emptyCartReady) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text-muted">
          <ShoppingBag size={26} strokeWidth={1.5} />
        </span>
        <h1 className="mt-6 text-xl font-semibold text-text">Your bag is empty</h1>
        <p className="mt-2 text-sm text-text-muted">Add a jersey to your bag, then come back to check out.</p>
        <Link
          href="/shop"
          className="mt-8 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    // pb-44 on mobile leaves room for the bottom nav + the sheet's handle
    // row, so the last thing on the page never sits underneath them.
    <div className="mx-auto max-w-350 px-4 pb-44 pt-6 sm:px-6 lg:px-8 lg:pb-16">
      <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-8">
          <section data-checkout-products>
            <h2 className="mb-3 text-sm font-semibold text-text">Delivery details</h2>
            <div className={shake ? 'animate-form-shake' : ''} onAnimationEnd={() => setShake(false)}>
              <CheckoutForm value={customer} errors={errors} onChange={updateCustomer} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-text">Your items</h2>
            <div className="mt-4 space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.id ?? item._id ?? item.name}-${index}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{
                      height: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
                      opacity: { duration: 0.2 },
                      layout: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
                    }}
                    className="overflow-hidden"
                  >
                    <ProductTabPanel
                      item={item}
                      onSizeChange={(size) => changeItemSize(index, size)}
                      onCustomizationChange={(customization) => changeItemCustomization(index, customization)}
                      onPatchChange={(patches) => changeItemPatches(index, patches)}
                      onRemove={() => removeCheckoutItem(index)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* DESKTOP — sticky summary column on the right */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
            <h2 className="mb-4 text-base font-semibold text-text">Order summary</h2>
            <OrderSummary
              items={items}
              deliveryLabel={deliveryLabel}
              deliveryFee={deliveryFee}
              subtotal={subtotal}
              total={total}
            />
            <div className="mt-6">
              <PlaceOrderButton submitting={submitting} onClick={handlePlaceOrder}>
                Place Order · Cash on Delivery
              </PlaceOrderButton>
            </div>
          </div>
        </aside>
      </div>

      {/* MOBILE — same summary, in the draggable bottom sheet */}
      <CheckoutBottomSheet total={total} itemCount={itemCount}>
        <OrderSummary
          items={items}
          deliveryLabel={deliveryLabel}
          deliveryFee={deliveryFee}
          subtotal={subtotal}
          total={total}
        />
        <div className="mt-5">
          <PlaceOrderButton submitting={submitting} onClick={handlePlaceOrder}>
            Place Order · COD
          </PlaceOrderButton>
        </div>
      </CheckoutBottomSheet>
    </div>
  );
}