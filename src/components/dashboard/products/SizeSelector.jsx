'use client';

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function SizeSelector({ value = [], onChange }) {
  function toggle(size) {
    onChange(value.includes(size) ? value.filter((s) => s !== size) : [...value, size]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SIZE_OPTIONS.map((size) => {
        const active = value.includes(size);
        return (
          <button
            key={size}
            type="button"
            onClick={() => toggle(size)}
            aria-pressed={active}
            className={`rounded-xl cursor-pointer border px-4 py-2 text-sm font-medium backdrop-blur-md transition-all duration-200 ${
              active
                ? 'border-primary bg-linear-to-r from-primary to-primary-light text-white shadow-[0_6px_16px_-6px_rgba(48,136,152,0.6)]'
                : 'border-border bg-white/60 text-text-muted hover:border-primary/40 hover:text-primary'
            }`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}