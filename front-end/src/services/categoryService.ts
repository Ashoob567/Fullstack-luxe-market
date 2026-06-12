// ============================================================
// services/categoryService.ts
// ============================================================

import api from "@/lib/api";
import { Category } from "@/types";

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get("/api/categories/");
  return data;
};

export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const { data } = await api.get(`/api/categories/${slug}/`);
  return data;
};