'use client';

import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice } from '@/lib/format';

const RANGES = [7, 14, 30];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs">
      <p className="font-medium text-text">{row.label}</p>
      <p className="mt-0.5 text-text-muted">
        {row.orders} {row.orders === 1 ? 'order' : 'orders'}, {formatPrice(row.revenue)}৳
      </p>
    </div>
  );
}

// Orders per day. The range switch is plain links (?range=7|14|30), so the
// server re-fetches the data — no client state to keep in sync.
export default function OrdersChart({ data, range }) {
  const total = data.reduce((sum, day) => sum + day.orders, 0);

  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text">Orders</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            {total} in the last {range} days
          </p>
        </div>

        <nav aria-label="Chart range" className="flex rounded-xl border border-border p-0.5 text-xs">
          {RANGES.map((days) => (
            <Link
              key={days}
              href={`/dashboard?range=${days}`}
              replace
              scroll={false}
              aria-current={days === range ? 'true' : undefined}
              className={`rounded-[10px] px-3 py-1.5 font-medium transition-colors ${
                days === range ? 'bg-ink text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {days}d
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#e6eced" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#687477', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#687477', fontSize: 11 }}
              width={40}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8f9f9' }} />
            <Bar dataKey="orders" fill="#308898" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
