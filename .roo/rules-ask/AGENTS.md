# AGENTS.md — Ask Mode

This file provides guidance to agents when answering questions about this repository.

## Project Context

Luxe Market is a Pakistani e-commerce platform (currency: PKR). Monorepo with `back-end/` (Django 5.0 REST API) and `front-end/` (Next.js 16 + React 19).

## Non-Obvious Code Organization

- `config/settings/` has three files: `base.py` (shared), `development.py`, `production.py`. The `__init__.py` auto-selects — `DJANGO_SETTINGS_MODULE` is never set manually.
- `apps/coupons/` has models and migrations but no `views.py`, no `urls.py`, and no tests — it is a data-only app consumed by `CartService`.
- `utils/storage.py` and `utils/mock_storage.py` live at the project root level (not inside any app) — they are shared utilities.
- `src/lib/stripe.ts` exists in the front-end but Stripe is not integrated — it's a placeholder. Payment is entirely mock (`mock_card`/`cod`).
- `src/components/products/Productdetailclient.tsx` — note the inconsistent casing (`detail` lowercase, `client` lowercase) vs other files.
- Two separate `PaginatedResponse<T>` interfaces exist: `src/types/product.ts` (product-specific, has `total_pages`/`current_page`) and `src/types/api.ts` (generic). This is intentional, not a bug.
- `back-end/setting.py` exists at the root of `back-end/` — this appears to be a stale/unused file; the real settings are in `config/settings/`.
- Cart has two sync layers: Zustand+localStorage (front-end primary) and Redis (back-end). They can diverge — the backend Redis cart is authoritative at checkout.
- `apps/orders/tests.py` and `apps/payments/tests.py` are flat files (not directories), unlike `apps/products/tests/` and `apps/users/tests/` which are packages.

## API Structure

All endpoints prefixed `/api/<app>/`:
- `/api/auth/` — JWT login, register, refresh, logout
- `/api/products/` — product catalog, categories, tags, reviews
- `/api/cart/` — add, update, remove, clear, coupon, merge
- `/api/payments/create-intent/` — checkout (mock only)
- `/api/orders/` — order history
- `/api/users/` — profile, addresses
