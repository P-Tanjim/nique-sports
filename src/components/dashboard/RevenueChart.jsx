'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '@/lib/format';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-xs shadow-[0_4px_16px_rgba(32,36,38,0.08)]">
      <p className="font-medium text-text-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-primary-dark">{formatPrice(payload[0].value)}৳</p>
    </div>
  );
}

// Client Component — Recharts needs the DOM to measure itself, so this
// piece alone opts out of server rendering. Everything around it in
// page.jsx stays a Server Component.
export default function RevenueChart({ data }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#308898" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#308898" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#d9e4e6" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#687477', fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#687477', fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d9e4e6', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#308898"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}