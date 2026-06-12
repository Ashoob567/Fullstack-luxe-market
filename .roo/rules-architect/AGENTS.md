# AGENTS.md — Architect Mode

This file provides guidance to agents when planning or designing changes in this repository.

## Architectural Constraints

### Back-end

- **Settings auto-selection is load-order sensitive** — `config/settings/__init__.py` checks `sys.modules` for `pytest` at import time. Any code that imports Django settings before pytest loads will get the wrong settings.
- **`ProductImage.image` storage is a callable** (`storage=get_supabase_storage`) — this defers `SupabaseStorage.__init__()` until the field is first accessed. Changing to an instance (`storage=SupabaseStorage()`) would break tests by requiring real Supabase credentials at import time.
- **Shipping constants are intentionally duplicated** in `apps/cart/services.py` and `apps/payments/views.py` — both must be kept in sync. Centralizing them into a shared constants module is a valid refactor but requires updating both import sites.
- **Cart is stateless on the model layer** — there is no `Cart` or `CartItem` Django model. The entire cart lives in Redis. `apps/cart/models.py` is empty. Any feature requiring cart persistence beyond Redis TTL (7d user, 24h guest) needs a new approach.
- **Circular import pattern** — `apps/cart/services.py` and `apps/payments/views.py` import `Product`/`ProductVariant` lazily inside functions to avoid circular imports. Any new cross-app imports in these files must follow the same lazy pattern.
- **`apps/coupons` is headless** — no views, no URLs. Coupon logic is entirely encapsulated in `CartService.apply_coupon()`. Adding coupon management endpoints requires creating `views.py` and `urls.py` from scratch.
- **All primary keys are UUIDs** (`uuid.uuid4`) across all models — never assume integer PKs.

### Front-end

- **Middleware is cookie-gated** (`src/middleware.ts`) — route protection for `/account` and `/checkout` depends on the `luxe_session` cookie, not JWT. Any auth flow that doesn't call `useAuthStore.setTokens()` will leave protected routes accessible.
- **Cart sync is fire-and-forget** — the front-end never awaits backend cart sync. The backend Redis cart can be stale. Checkout reads from Redis directly, so items added while offline/unauthenticated may be missing at checkout.
- **No server components for authenticated data** — all auth-dependent data fetching is client-side (localStorage tokens). Server components cannot access JWT tokens.
- **`next.config.ts` uses `module.exports`** (not `export default`) despite being a `.ts` file — this is intentional for Next.js 16 compatibility.
- **shadcn/ui is the only permitted UI component source** for `src/components/ui/` — custom primitives must go elsewhere (e.g., `src/components/common/`).
