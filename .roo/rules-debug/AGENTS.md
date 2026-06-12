# AGENTS.md — Debug Mode

This file provides guidance to agents when debugging issues in this repository.

## Back-end Debugging

- Settings auto-selection happens in `config/settings/__init__.py` — if settings seem wrong, check whether `pytest` is in `sys.modules` or `DJANGO_SETTINGS_MODULE` env var is set.
- Tests silently switch to SQLite `:memory:` — if a test passes locally but fails in a specific DB scenario, check `config/settings/development.py` lines 22–29.
- `REDIS_URL` is NOT in `.env.example` — a missing Redis connection causes `django_redis` to fail silently on cache operations. Check `settings.REDIS_URL` and Redis connectivity first when cart/session issues occur.
- `ProductImage.save()` calls `self.image.url` which triggers `SupabaseStorage.url()` — if image URLs are empty strings in DB, the `get_public_url()` response format may have changed (see `utils/storage.py` for the dict/string dual-handling).
- Cart Redis keys: `cart:{user_id}` for authenticated, `cart:guest:{session_key}` for guests. Payment view uses `cache.delete(f"cart:{user_id}")` — if cart isn't clearing after checkout, check this key format matches `CartService`.
- `apps/coupons` has no URLs registered — coupon endpoints don't exist; coupons are applied only via `POST /api/cart/coupon/`.
- Slug collisions: `pre_save` signals only generate slugs when `not instance.slug` — if a slug already exists and conflicts, it won't be regenerated automatically.
- `ProductVariant.final_price` is a `@property` — it cannot be used in `filter()`/`annotate()` ORM queries; compute in Python or add a DB field.

## Front-end Debugging

- Middleware (`src/middleware.ts`) checks only the `luxe_session` cookie — if protected routes redirect unexpectedly, the cookie may not be set. `localStorage` tokens alone are insufficient for middleware.
- The 401 refresh queue in `api.ts` uses a module-level `isRefreshing` flag — if refresh loops occur, check that no other code is calling the refresh endpoint directly.
- Cart state is initialized from `localStorage` at module load time (bottom of `src/store/cartStore.ts`) — stale cart data from a previous session will be loaded immediately on page load.
- `post<T>()` in `api.ts` logs full backend error details to console (`STATUS`, `DATA`, `HEADERS`) — check browser console for detailed Django error responses.
- `src/lib/stripe.ts` exists but Stripe is not wired to real payments — if Stripe-related errors appear, the file is likely imported accidentally.
- Two `PaginatedResponse<T>` types exist — importing from the wrong file (`api.ts` vs `product.ts`) causes missing `total_pages`/`current_page` at runtime with no TypeScript error if the optional fields are used.
