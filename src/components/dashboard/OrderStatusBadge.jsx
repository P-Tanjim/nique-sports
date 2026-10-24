import { CheckCircle2, Circle, Clock, Package, RotateCcw, Truck, XCircle } from 'lucide-react';

// Status shown as an icon; the label stays for screen readers + tooltip.
const STATUS = {
  pending: { icon: Clock, label: 'Pending', tone: 'text-text-muted' },
  processing: { icon: Package, label: 'Processing', tone: 'text-text-muted' },
  shipped: { icon: Truck, label: 'On the way', tone: 'text-primary' },
  delivered: { icon: CheckCircle2, label: 'Delivered', tone: 'text-primary' },
  cancelled: { icon: XCircle, label: 'Cancelled', tone: 'text-danger' },
  returned: { icon: RotateCcw, label: 'Returned', tone: 'text-warning' },
};

export default function OrderStatusBadge({ status, showLabel = false, size = 18 }) {
  const key = String(status ?? '').toLowerCase();
  const meta = STATUS[key] ?? { icon: Circle, label: String(status || 'Unknown'), tone: 'text-text-muted' };
  const Icon = meta.icon;

  return (
    <span title={meta.label} className={`inline-flex items-center gap-1.5 ${meta.tone}`}>
      <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
      {showLabel ? <span className="text-xs font-medium">{meta.label}</span> : <span className="sr-only">{meta.label}</span>}
    </span>
  );
}
