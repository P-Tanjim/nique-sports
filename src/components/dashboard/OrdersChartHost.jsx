'use client';

import dynamic from 'next/dynamic';

const OrdersChart = dynamic(() => import('./OrdersChart'), {
  loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-surface" />,
  ssr: false,
});

export default function OrdersChartHost(props) {
  return <OrdersChart {...props} />;
}
