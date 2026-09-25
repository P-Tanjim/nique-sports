// Server Component — pure presentation, no interactivity, so it costs zero
// client JS. Every field is read defensively: your schema's `discount` is
export default function ProductInfo({ product }) {
  const { title, desc, team, seassion, stock } = product;

  const stockCount = Number(stock) || 0;
  const isOutOfStock = stockCount <= 0;
  const isLowStock = !isOutOfStock && stockCount <= 5;

  return (
    <div>
      {(team || seassion) && (
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
          {[team?.replace(/-/g, ' '), seassion].filter(Boolean).join(' • ')}
        </p>
      )}

      <h1 className="mt-2 text-2xl font-semibold leading-tight text-text sm:text-3xl">
        {title}
      </h1>

      {isOutOfStock ? (
        <p className="mt-2 text-sm font-medium text-danger">Out of stock</p>
      ) : isLowStock ? (
        <p className="mt-2 text-sm font-medium text-warning">Only {stockCount} left in stock</p>
      ) : null}

      {desc && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
          {desc}
        </p>
      )}
    </div>
  );
}