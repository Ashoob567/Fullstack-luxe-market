// src/app/(shop)/products/loading.tsx
// Skeleton shown by Next.js while page.tsx is streaming / fetching data.

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden">
      {/* Image placeholder */}
      <div
        className="animate-pulse bg-[#F0EBE3] aspect-square w-full"
      />

      {/* Text placeholders */}
      <div className="p-4 flex flex-col gap-2.5">
        {/* Name line */}
        <div
          className="animate-pulse bg-bg-skeleton-1 rounded-md h-4 w-3/4"
        />
        {/* Price line */}
        <div
          className="animate-pulse bg-bg-skeleton-1 rounded-md h-4 w-1/2"
        />
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-brand-bg-light">
      {/* Header skeleton */}
      <div className="max-w-screen-2xl mx-auto py-10 px-6">
        {/* Title */}
        <div
          className="animate-pulse bg-bg-skeleton-1 rounded-lg h-8 w-[180px] mb-2"
        />
        {/* Subtitle */}
        <div
          className="animate-pulse bg-[#EDE8E1] rounded-md h-3.5 w-[260px]"
        />
      </div>

      {/* Main layout */}
      <div className="max-w-screen-2xl mx-auto px-6 pb-16">
        <div className="flex gap-8 items-start">
          {/* Sidebar skeleton — desktop only */}
          <aside className="hidden md:block w-[280px] shrink-0">
            <div className="bg-white border border-[#E8E0D5] rounded-2xl p-5 flex flex-col gap-3">
              {[100, 70, 85, 60, 90, 55].map((w, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-bg-skeleton-1 rounded-md h-3.5"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </aside>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* Top bar skeleton */}
            <div className="bg-white border border-[#E8E0D5] rounded-xl px-5 py-3.5 flex justify-between items-center mb-6">
              <div
                className="animate-pulse bg-bg-skeleton-1 rounded-md h-3.5 w-[120px]"
              />
              <div
                className="animate-pulse bg-bg-skeleton-1 rounded-lg h-8 w-[140px]"
              />
            </div>

            {/* 9-card skeleton grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}