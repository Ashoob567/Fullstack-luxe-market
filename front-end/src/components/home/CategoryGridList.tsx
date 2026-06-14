// src/components/home/CategoryGridList.tsx
"use client";

import type { Category } from "@/types";
import CategoryCard from "./CategoryCard";

interface Props {
  categories: Category[];
}

export default function CategoryGridList({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-brand-text-muted">
        <p>No categories available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {categories.map((category, i) => (
        <CategoryCard key={category.id} category={category} index={i} />
      ))}
    </div>
  );
}