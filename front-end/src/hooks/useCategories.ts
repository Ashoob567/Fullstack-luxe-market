// ============================================================
// hooks/useCategories.ts
// ============================================================

import { useState, useEffect } from "react";
import { getCategories, getCategoryBySlug } from "@/services/categoryService";
import { Category } from "@/types";

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

// ----------------------------------------------------------
// useCategories — fetch all root categories
// ----------------------------------------------------------

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getCategories();
        if (!cancelled) setCategories(result);
      } catch (err) {
        if (!cancelled) setError(extractError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading, error };
};

// ----------------------------------------------------------
// useCategoryBySlug — single category detail
// ----------------------------------------------------------

export const useCategoryBySlug = (slug: string) => {
  const [category, setCategory]   = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getCategoryBySlug(slug);
        if (!cancelled) setCategory(result);
      } catch (err) {
        if (!cancelled) setError(extractError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { category, isLoading, error };
};
