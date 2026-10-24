import { AlertTriangle, Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export function CourierBadge({ status }) {
  if (!status) return null;
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium capitalize text-text-muted">
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

export function RiderIssueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
      <AlertTriangle size={11} />
      Rider issue
    </span>
  );
}

export function AdvanceBadge({ advance, account }) {
  if (!(advance > 0)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary-dark">
      <Wallet size={11} />
      {formatPrice(advance)}৳ {account ? `· ${account}` : ''}
    </span>
  );
}
