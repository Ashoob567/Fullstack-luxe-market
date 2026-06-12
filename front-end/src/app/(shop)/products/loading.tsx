// src/app/(shop)/products/loading.tsx
// Skeleton shown by Next.js while page.tsx is streaming / fetching data.

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E8E0D5",
        overflow: "hidden",
      }}
    >
      {/* Image placeholder */}
      <div
        className="animate-pulse"
        style={{
          background: "#F0EBE3",
          aspectRatio: "1 / 1",
          width: "100%",
        }}
      />

      {/* Text placeholders */}
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {/* Name line */}
        <div
          className="animate-pulse"
          style={{
            background: "#E8E0D5",
            borderRadius: "6px",
            height: "1rem",
            width: "75%",
          }}
        />
        {/* Price line */}
        <div
          className="animate-pulse"
          style={{
            background: "#E8E0D5",
            borderRadius: "6px",
            height: "1rem",
            width: "50%",
          }}
        />
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F4" }}>
      {/* Header skeleton */}
      <div
        style={{ maxWidth: "80rem", margin: "0 auto" }}
        className="py-10 px-6"
      >
        {/* Title */}
        <div
          className="animate-pulse"
          style={{
            background: "#E8E0D5",
            borderRadius: "8px",
            height: "2rem",
            width: "180px",
            marginBottom: "0.5rem",
          }}
        />
        {/* Subtitle */}
        <div
          className="animate-pulse"
          style={{
            background: "#EDE8E1",
            borderRadius: "6px",
            height: "0.875rem",
            width: "260px",
          }}
        />
      </div>

      {/* Main layout */}
      <div
        style={{ maxWidth: "80rem", margin: "0 auto" }}
        className="px-6 pb-16"
      >
        <div className="flex gap-8 items-start">
          {/* Sidebar skeleton — desktop only */}
          <aside
            className="hidden md:block"
            style={{ width: "280px", flexShrink: 0 }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E0D5",
                borderRadius: "16px",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[100, 70, 85, 60, 90, 55].map((w, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    background: "#E8E0D5",
                    borderRadius: "6px",
                    height: "0.875rem",
                    width: `${w}%`,
                  }}
                />
              ))}
            </div>
          </aside>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* Top bar skeleton */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E0D5",
                borderRadius: "12px",
                padding: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                className="animate-pulse"
                style={{
                  background: "#E8E0D5",
                  borderRadius: "6px",
                  height: "0.875rem",
                  width: "120px",
                }}
              />
              <div
                className="animate-pulse"
                style={{
                  background: "#E8E0D5",
                  borderRadius: "8px",
                  height: "2rem",
                  width: "140px",
                }}
              />
            </div>

            {/* 9-card skeleton grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ gap: "1.5rem" }}
            >
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