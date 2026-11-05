import { ChevronDown, ChevronUp, MapPin, MessageSquare, Phone, User } from 'lucide-react';

export default function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-350 px-4 pb-44 pt-6 sm:px-6 lg:px-8 lg:pb-16 animate-pulse">
      {/* Title */}
      <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
        Checkout
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Delivery details & Items */}
        <div className="min-w-0 space-y-8">
          {/* Section 1: Delivery details */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-text">Delivery details</h2>
            <div className="grid gap-4 rounded-3xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:grid-cols-2 sm:p-6">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Full Name
                </label>
                <div className="relative mt-1.5 flex items-center rounded-2xl border border-border bg-surface py-3 pl-10 pr-4">
                  <User size={18} className="absolute left-3.5 text-text-muted/40" />
                  <div className="h-4 w-32 rounded bg-border/60" />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Delivery Address
                </label>
                <div className="relative mt-1.5 rounded-2xl border border-border bg-surface py-3 pl-10 pr-4">
                  <MapPin size={18} className="absolute left-3.5 top-3.5 text-text-muted/40" />
                  <div className="space-y-1.5 py-0.5">
                    <div className="h-3.5 w-48 rounded bg-border/60" />
                    <div className="h-3.5 w-36 rounded bg-border/40" />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Phone Number
                </label>
                <div className="relative mt-1.5 flex items-center rounded-2xl border border-border bg-surface py-3 pl-10 pr-4">
                  <Phone size={18} className="absolute left-3.5 text-text-muted/40" />
                  <div className="h-4 w-28 rounded bg-border/60" />
                </div>
              </div>

              {/* Number 2 (optional) */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Number 2 <span className="normal-case text-text-muted/70">(optional)</span>
                </label>
                <div className="relative mt-1.5 flex items-center rounded-2xl border border-border bg-surface py-3 pl-10 pr-4">
                  <Phone size={18} className="absolute left-3.5 text-text-muted/40" />
                  <div className="h-4 w-24 rounded bg-border/40" />
                </div>
              </div>

              {/* Additional Note (optional) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Additional Note <span className="normal-case text-text-muted/70">(optional)</span>
                </label>
                <div className="relative mt-1.5 rounded-2xl border border-border bg-surface py-3 pl-10 pr-4">
                  <MessageSquare size={18} className="absolute left-3.5 top-3.5 text-text-muted/40" />
                  <div className="my-1 h-3.5 w-56 rounded bg-border/40" />
                </div>
              </div>

              {/* Delivery Area */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Delivery Area
                </label>
                <div className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary/50">
                      <MapPin size={17} />
                    </span>
                    <span className="min-w-0 space-y-1">
                      <span className="block h-3.5 w-24 rounded bg-border/70" />
                      <span className="block h-3 w-32 rounded bg-border/50" />
                    </span>
                  </span>
                  <ChevronDown size={17} className="text-text-muted/40" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted">
                  Payment Method
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-center rounded-2xl border-2 border-primary/40 bg-primary-soft/60 px-4 py-3 text-sm font-semibold text-primary/70">
                    Cash on Delivery
                  </div>
                  <div className="flex items-center justify-center rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-muted/50">
                    bKash — soon
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Your items */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-text">Your items</h2>
            <div className="mt-4 space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="relative flex gap-4 rounded-3xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:gap-5 sm:p-5"
                >
                  {/* Left: Product image placeholder */}
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-surface sm:h-40 sm:w-40" />

                  {/* Right: Details column placeholder */}
                  <div className="flex min-w-0 flex-1 flex-col gap-3.5">
                    <div>
                      <div className="h-4.5 w-4/5 rounded bg-border/70 sm:h-5" />
                      <div className="mt-2 h-3 w-32 rounded bg-border/50" />
                    </div>

                    {/* Size options */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Size
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['S', 'M', 'L', 'XL', 'XXL'].map((sz, idx) => (
                          <div
                            key={sz}
                            className={`flex h-8 min-w-9 items-center justify-center rounded-lg border text-xs font-semibold ${
                              idx === 1
                                ? 'border-primary/40 bg-primary-soft/60 text-primary/70'
                                : 'border-border bg-white text-text-muted/40'
                            }`}
                          >
                            {sz}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Patch options */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        Patch
                      </p>
                      <div className="flex gap-2">
                        <div className="h-12 w-12 rounded-xl border border-border bg-surface" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (Desktop): Order Summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
            <h2 className="mb-4 text-base font-semibold text-text">Order summary</h2>
            <div className="space-y-4">
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="h-4 w-3/4 rounded bg-border/70" />
                      <div className="h-3 w-1/3 rounded bg-border/50" />
                    </div>
                    <div className="h-4 w-14 shrink-0 rounded bg-border/60" />
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <div className="h-4 w-16 rounded bg-border/60" />
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Delivery</span>
                  <div className="h-4 w-12 rounded bg-border/60" />
                </div>
                <div className="flex justify-between border-t border-border pt-2.5 text-base font-semibold text-text">
                  <span>Total</span>
                  <div className="h-5 w-20 rounded bg-border/70" />
                </div>
              </div>
            </div>

            {/* Complete Order Button placeholder */}
            <div className="mt-6">
              <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary/80 text-sm font-semibold text-white">
                Complete Order
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Sheet Peek placeholder */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg overflow-hidden rounded-t-3xl border-t border-x border-border/70 bg-white/80 shadow-[0_-8px_30px_rgba(32,36,38,0.12)] backdrop-blur-xl lg:hidden">
        <div className="flex flex-col items-center gap-2 px-5 pt-3 pb-22">
          <span className="h-1 w-10 rounded-full bg-border" />
          <div className="flex w-full items-center justify-between">
            <div className="h-3.5 w-14 rounded bg-border/60" />
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-16 rounded bg-border/70" />
              <ChevronUp size={15} className="text-text-muted/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

