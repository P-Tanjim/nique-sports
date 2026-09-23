const STATUS_STYLES = {
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-primary-soft text-primary-dark',
  shipped: 'bg-accent/15 text-primary-dark',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? 'bg-surface text-text-muted';
  const label = STATUS_LABELS[status] ?? status;

  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>{label}</span>;
}