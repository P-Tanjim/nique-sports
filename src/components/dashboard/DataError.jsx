import { TriangleAlert } from 'lucide-react';

export default function DataError({ title = "Couldn't load this page" }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-16 text-center">
      <TriangleAlert size={22} strokeWidth={1.6} className="text-text-muted" />
      <h2 className="mt-4 text-base font-semibold text-text">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-text-muted">
        The API didn&apos;t answer. Check that the backend is running and that ADMIN_API_KEY is
        the same value on both the website and the backend, then reload.
      </p>
    </div>
  );
}
