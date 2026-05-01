"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string | number;
  name: string;
  description?: string;
  tagline?: string;
  product_count?: number;
  productCount?: number;
  image_url?: string;
  imageUrl?: string;
  slug?: string;
}

// Skeleton card shown while loading
function SkeletonCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-[420px] md:h-[500px] bg-[#E2DDD6] animate-pulse">
      {/* Simulated gradient sheen */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2C2416]/40 via-transparent to-transparent" />
      {/* Content placeholder */}
      <div className="absolute bottom-0 left-0 p-8 space-y-3 w-full">
        <div className="h-8 w-2/5 rounded-md bg-[#C8C0B4]" />
        <div className="h-3 w-3/5 rounded bg-[#C8C0B4]" />
        <div className="h-3 w-2/5 rounded bg-[#C8C0B4]" />
        <div className="h-9 w-36 rounded-md bg-[#C8C0B4] mt-4" />
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
  const productCount =
    category.product_count ?? category.productCount ?? 0;
  const imageUrl =
    category.image_url ?? category.imageUrl ?? "/placeholder.jpg";
  const tagline =
    category.tagline ??
    category.description ??
    "Discover the finest selection curated for you.";
  const href = category.slug
    ? `/categories/${category.slug}`
    : `/categories/${category.id}`;

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer h-[420px] md:h-[500px] group"
      role="link"
      tabIndex={0}
      aria-label={`Browse ${category.name}`}
      onClick={() => (window.location.href = href)}
      onKeyDown={(e) => e.key === "Enter" && (window.location.href = href)}
    >
      {/* Full-bleed background image with scale-on-hover */}
      <div className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover w-full h-full"
          priority
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2C2416]/90 via-[#2C2416]/30 to-transparent" />

      {/* Card content */}
      <div className="absolute bottom-0 left-0 p-8">
        {/* Category name */}
        <h2
          className="font-serif font-bold text-3xl text-white leading-tight tracking-wide"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {category.name}
        </h2>

        {/* 2-line italic tagline */}
        <p
          className="text-[#D8CFC0] text-sm mt-1 italic leading-snug max-w-[260px]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tagline}
        </p>

        {/* Product count */}
        {productCount > 0 && (
          <p className="text-xs text-[#A89880] mt-1 tracking-widest uppercase">
            {productCount} products
          </p>
        )}

        {/* CTA button */}
        <button
          className="mt-4 bg-white text-[#2C2416] text-sm font-medium px-6 py-2.5 rounded-md hover:bg-[#F5F0E8] transition-colors duration-200 inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/60"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = href;
          }}
          aria-label={`Shop ${category.name}`}
        >
          Shop Now
          <ArrowRight size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/categories");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Handle both { categories: [...] } and plain array
        const list: Category[] = Array.isArray(data)
          ? data
          : data.categories ?? data.data ?? [];
        if (!cancelled) setCategories(list);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-12 px-4 bg-[#F5F3EF]">
      {/* Optional section header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs tracking-[0.25em] uppercase text-[#A89880] font-medium">
            Collections
          </p>
          <h1
            className="font-serif text-4xl font-bold text-[#2C2416] mt-1 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Shop by Category
          </h1>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-16 text-[#A89880] text-sm">
            <p>Could not load categories — {error}</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}