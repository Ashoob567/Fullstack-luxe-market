export default function ProductDetailLoading() {
  return (
    <div className="container py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        <span className="text-muted-foreground">/</span>
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <span className="text-muted-foreground">/</span>
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-lg bg-muted animate-pulse" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="flex flex-col gap-5">
          <div className="h-10 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-12 w-1/3 rounded bg-muted animate-pulse" />

          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          </div>

          <div className="space-y-3">
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
            <div className="h-12 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
