// src/components/common/SkeletonCard.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * SkeletonCard
 * Mirrors ProductCard's exact layout and dimensions while data loads.
 * Background: #F5F3EF (Luxe Market sand/cream).
 */
export function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden border border-[#E8E4DC] flex flex-col"
      style={{ backgroundColor: "#F5F3EF" }}
      aria-busy="true"
      aria-label="Loading product"
    >
      {/* ── Image area: aspect-[3/4] ── */}
      <div className="relative w-full aspect-[3/4]">
        <Skeleton
          className="absolute inset-0 w-full h-full rounded-none"
          style={{ backgroundColor: "#EAE6DF" }}
        />
        {/* Badge placeholder — top-left */}
        <Skeleton
          className="absolute top-3 left-3 h-6 w-12 rounded-full"
          style={{ backgroundColor: "#DDD9D0" }}
        />
        {/* Heart button placeholder — top-right */}
        <Skeleton
          className="absolute top-3 right-3 h-8 w-8 rounded-full"
          style={{ backgroundColor: "#DDD9D0" }}
        />
      </div>

      {/* ── Content area: padding 12px ── */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Category */}
        <Skeleton
          className="h-3 w-1/3 rounded"
          style={{ backgroundColor: "#DDD9D0" }}
        />

        {/* Product name */}
        <Skeleton
          className="h-4 w-4/5 rounded"
          style={{ backgroundColor: "#DDD9D0" }}
        />

        {/* Star rating row */}
        <Skeleton
          className="h-3 w-2/5 rounded"
          style={{ backgroundColor: "#DDD9D0" }}
        />

        {/* Price row */}
        <Skeleton
          className="h-4 w-1/2 rounded"
          style={{ backgroundColor: "#DDD9D0" }}
        />

        {/* ── Two CTA button placeholders ── */}
        <div className="flex gap-2 mt-auto pt-1">
          <Skeleton
            className="flex-1 h-9 rounded-md"
            style={{ backgroundColor: "#DDD9D0" }}
          />
          <Skeleton
            className="flex-1 h-9 rounded-md"
            style={{ backgroundColor: "#DDD9D0" }}
          />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;