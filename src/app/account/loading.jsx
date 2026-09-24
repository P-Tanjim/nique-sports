// loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-surface text-text">
      <div className="mx-auto max-w-350 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        
        {/* Skeleton Grid mirroring the AccountOverview layout */}
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] animate-pulse">
          
          {/* AVATAR CARD SKELETON */}
          <div className="rounded-3xl border border-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(32,36,38,0.04)]">
            {/* Avatar Circle */}
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-200" />
            {/* Name Line */}
            <div className="mx-auto mt-6 h-5 w-32 rounded-md bg-gray-200" />
            {/* Member Since Line */}
            <div className="mx-auto mt-2 h-3 w-24 rounded-md bg-gray-200" />
          </div>

          {/* DETAILS CARD SKELETON */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(32,36,38,0.04)] sm:p-8">
            {/* Header */}
            <div className="mb-4 h-4 w-32 rounded-md bg-gray-200" />
            
            <div className="mt-2">
              {/* Detail Row 1 */}
              <div className="flex items-start gap-3 border-b border-border/60 py-4">
                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-20 rounded-md bg-gray-200" />
                  <div className="mt-2 h-4 w-48 max-w-full rounded-md bg-gray-200" />
                </div>
              </div>
              
              {/* Detail Row 2 */}
              <div className="flex items-start gap-3 border-b border-border/60 py-4">
                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded-md bg-gray-200" />
                  <div className="mt-2 h-4 w-32 max-w-full rounded-md bg-gray-200" />
                </div>
              </div>

              {/* Detail Row 3 */}
              <div className="flex items-start gap-3 pt-4">
                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-16 rounded-md bg-gray-200" />
                  <div className="mt-2 h-4 w-56 max-w-full rounded-md bg-gray-200" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}