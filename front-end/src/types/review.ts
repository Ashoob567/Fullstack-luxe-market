// ============================================================
// types/review.ts
// Based on: products/serializers.py → ReviewSerializer
// ============================================================

export interface Review {
  id: string;                        // UUID
  product: string;                   // UUID — product ka id
  user: string;                      // UUID — user ka id (read_only)
  user_name: string;                 // "First Last" ya email (SerializerMethodField)
  rating: number;                    // 1–5
  comment: string | null;
  created_at: string;                // ISO datetime string
  updated_at: string;                // ISO datetime string
}

// POST request k liye — sirf yeh fields bheji jaati hain
export interface CreateReviewPayload {
  product: string;                   // UUID
  rating: number;
  comment?: string;
}