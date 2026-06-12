# AGENTS.md

This file provides guidance to agents when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Commands (run from `front-end/`)

```bash
npm install
npm run dev
npm run build
npm run lint        # eslint only — no separate type-check script
```

## Critical Non-Obvious Facts

- All API calls MUST go through `src/lib/api.ts` typed helpers (`get<T>`, `post<T>`, `put<T>`, `patch<T>`, `del<T>`). Never use `fetch` or `axios` directly in components.
- Auth tokens stored in `localStorage` (`accessToken`, `refreshToken`) AND a `luxe_session=1` cookie. The cookie is required for middleware route protection (`/account`, `/checkout`). Always use `useAuthStore.setTokens()` — it handles both automatically.
- `api.ts` has a built-in 401 → token refresh queue. Concurrent 401s are queued and replayed after refresh — do not add manual refresh logic elsewhere.
- Two `PaginatedResponse<T>` types exist: `src/types/product.ts` (has `total_pages`/`current_page`, use for products) and `src/types/api.ts` (generic, no `total_pages`). Import from the correct one.
- Cart store (`src/store/cartStore.ts`) is dual-layer: Zustand + `localStorage` (primary) with fire-and-forget Redis sync to backend. Guest cart is localStorage-only (no backend sync). Backend cart is cleared by the payment view after order creation — `clearCart()` only clears localStorage.
- `next.config.ts` whitelists only `iljvzwluibwuxyjavpwb.supabase.co` for `next/image`. Adding new image domains requires updating `remotePatterns` there.
- UI components in `src/components/ui/` are shadcn/ui — do not edit them directly; regenerate via `npx shadcn add <component>`.
- Payment is mock-only despite `@stripe/stripe-js` being installed. Methods: `mock_card` or `cod`. `src/lib/stripe.ts` exists but is not wired to real Stripe.
- Currency is PKR throughout. No i18n/locale system.
- `NEXT_PUBLIC_API_URL` env var points to Django backend (default: `http://localhost:8000`).
