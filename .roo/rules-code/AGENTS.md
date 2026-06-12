# AGENTS.md — Code Mode

This file provides guidance to agents when writing or modifying code in this repository.

## Back-end Coding Rules

- Never use `User` model directly — always `get_user_model()` or `settings.AUTH_USER_MODEL`.
- `ProductImage.image` field uses `storage=get_supabase_storage` (callable, not instance) — this pattern is intentional to defer instantiation; do not change to `storage=SupabaseStorage()`.
- Never set `image_url` manually when `image` is set — `ProductImage.save()` always regenerates it from `image.url`.
- Use `Product.effective_price` for all price logic (priority: flash_sale_price → sale_price → base_price). `ProductVariant.final_price` = `effective_price + price_modifier`.
- Never set slugs manually on first save for `Product`, `Category`, `ProductTag` — `pre_save` signals in `apps/products/signals.py` handle generation.
- Cart operations must go through `CartService` in `apps/cart/services.py`, not direct Redis calls.
- Shipping constants (`FREE_SHIPPING_THRESHOLD = 3000`, `SHIPPING_COST = 200` PKR) are duplicated in `apps/cart/services.py` AND `apps/payments/views.py` — update both if changing.
- Payment methods are `mock_card` or `cod` only — no Stripe integration exists despite the package being installed.
- `REDIS_URL` is required but missing from `.env.example` — remind users to add it.
- Import `Product`/`ProductVariant` lazily inside functions when in `apps/cart/` or `apps/payments/` to avoid circular imports (see existing pattern in `services.py`).

## Front-end Coding Rules

- All HTTP calls MUST use helpers from `src/lib/api.ts` (`get<T>`, `post<T>`, `put<T>`, `patch<T>`, `del<T>`). Never use raw `fetch` or `axios` in components or hooks.
- Auth tokens: always use `useAuthStore.setTokens()` — it writes to both `localStorage` AND sets the `luxe_session=1` cookie required by middleware. Never write tokens manually.
- `useAuthStore.logout()` clears both `localStorage` and the `luxe_session` cookie — use it, don't roll your own.
- For product pagination, import `PaginatedResponse<T>` from `src/types/product.ts` (has `total_pages`/`current_page`). For other paginated endpoints use `src/types/api.ts`.
- Cart store (`src/store/cartStore.ts`) syncs to backend fire-and-forget — never `await` the sync helpers. Guest users get no backend sync.
- `next.config.ts` `remotePatterns` only allows `iljvzwluibwuxyjavpwb.supabase.co` — update it when adding new image hosts.
- shadcn/ui components in `src/components/ui/` must NOT be edited directly — regenerate with `npx shadcn add <component>`.
- Do not add a token refresh interceptor — `src/lib/api.ts` already has one with a concurrent-request queue.
- Currency display is always PKR — no locale/i18n formatting utilities exist; format manually as `PKR {amount}`.
