// ============================================================
// types/api.ts
// Generic API response wrappers — DRF standard shapes
// ============================================================

// ----------------------------------------------------------
// Paginated response — DRF default pagination
// e.g. GET /api/products/ ka response
// ----------------------------------------------------------

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;               // URL of next page
  previous: string | null;           // URL of previous page
  results: T[];
}

// ----------------------------------------------------------
// Generic success response
// ----------------------------------------------------------

export interface ApiSuccess<T = null> {
  message?: string;
  data?: T;
}

// ----------------------------------------------------------
// Generic error response — DRF validation errors
// e.g. { "email": ["This field is required."] }
// ----------------------------------------------------------

export type ApiError = Record<string, string[]>;

// ----------------------------------------------------------
// Generic API state — React Query / SWR k saath use karo
// ----------------------------------------------------------

export interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}