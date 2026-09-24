import Image from 'next/image';

// Server Component. Only rendered when product.patch is true — if the
// document says a patch is available but patchsImg is still empty (data
// not filled in yet), this falls back to a plain note instead of rendering
// an empty, broken-looking grid.
export default function PatchGallery({ images }) {
  const list = images ?? [];

  if (!list.length) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-text-muted">
        Patch options available — contact us to choose one before checkout.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-semibold text-text">Patch options</p>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {list.map((src, index) => (
          <div
            key={src + index}
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-white"
          >
            <Image
              loading="eager"
              src={src}
              alt={`Patch option ${index + 1}`}
              fill
              sizes="80px"
              className="object-contain p-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}