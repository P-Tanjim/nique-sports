// Quiet placeholder shown while any /dashboard page loads.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-border/60" />
        <div className="h-4 w-28 rounded bg-border/40" />
      </div>
      <div className="h-32 rounded-2xl border border-border bg-white" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="h-80 rounded-2xl border border-border bg-white" />
        <div className="h-80 rounded-2xl border border-border bg-white" />
      </div>
    </div>
  );
}
