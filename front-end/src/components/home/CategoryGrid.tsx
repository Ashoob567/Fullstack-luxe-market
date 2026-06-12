// src/components/home/CategoryGrid.tsx
// ✅ No "use client" — Server Component

import { serverGet } from '@/lib/api-server';
import type { Category, PaginatedResponse } from "@/types";
import CategoryGridHeader from "./CategoryGridHeader";
import CategoryGridList from "./CategoryGridList";

async function getCategories(): Promise<Category[]> {
  try {
    const data = await serverGet<Category[] | PaginatedResponse<Category>>(
      '/api/categories/',
      {
        revalidate: 3600,
        tags: ['categories'],
      }
    );

    const items = Array.isArray(data)
      ? data
      : (data as PaginatedResponse<Category>).results ?? [];

    return items.filter((c) => c.is_active);

  } catch (err) {
    console.error('Categories fetch error:', err);
    return [];
  }
}

export default async function CategoryGrid() {
  const categories = await getCategories();

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#0f0f1a" }}>
      <div className="max-w-7xl mx-auto">

        {/* ✅ Header — Client (animation ke liye) */}
        <CategoryGridHeader />

        {/* ✅ Grid — Client (animation ke liye) */}
        <CategoryGridList categories={categories} />

      </div>
    </section>
  );
}