# AGENTS.md
these urls will fetch categories details right now this we had two categories 
http://127.0.0.1:8000/api/categories/undergarments/
http://127.0.0.1:8000/api/categories/watches/

List of products 
http://127.0.0.1:8000/api/products/ ,it will fetch all products of existing categories 

http://127.0.0.1:8000/api/products/watches/ this will fetch list of products whos categories is watches 
http://127.0.0.1:8000/api/products/undergarments/ this will fetch list of products whos categories is undergarments 
This file provides guidance to agents when working with code in this repository.

## Project Structure

Monorepo with two independent sub-projects:
- `back-end/` — Django 5.0 REST API (run all commands from `back-end/`)
- `front-end/` — Next.js 16 + React 19 app (run all commands from `front-end/`)

## Back-end (Django)

**Commands** (run from `back-end/`):
```bash
pip install -r requirements/development.txt
python manage.py runserver
pytest                                  # all tests (uses SQLite :memory: automatically)
pytest apps/products/tests/             # single app tests
black . && isort . && flake8 .
```

**Critical non-obvious facts:**
- `DJANGO_SETTINGS_MODULE` is NOT set manually — `config/settings/__init__.py` auto-selects `development` or `production` based on env var and detects `pytest` in `sys.modules` to switch to SQLite `:memory:` automatically.
- Custom user model: `AUTH_USER_MODEL = 'users.CustomUser'` — never use `User` directly, always `get_user_model()` or `settings.AUTH_USER_MODEL`.
- Image storage uses `utils/storage.py` (`SupabaseStorage`) in production and `utils/mock_storage.py` in tests. `ProductImage.image` field uses `storage=get_supabase_storage` (callable, not instance) to defer instantiation.
- `ProductImage.save()` always regenerates `image_url` from `image.url` — do not set `image_url` manually when `image` is set.
- `Product.effective_price` is the canonical price used everywhere (handles flash sale, sale, and base price priority). Never compute price manually.
- Cart is Redis-backed (`apps/cart/services.py` → `CartService`). Keys: `cart:{user_id}` (7d TTL) and `cart:guest:{session_key}` (24h TTL). Payment view clears cart via `cache.delete()` after order creation.
- Slugs for `Product`, `Category`, `ProductTag` are auto-generated via `pre_save` signals — never set them manually on first save.
- Shipping: free above PKR 3000, flat PKR 200 below. Defined in both `apps/cart/services.py` and `apps/payments/views.py` (keep in sync).
- Payment is mock-only (`apps/payments/mock_processor.py`). Methods: `mock_card` or `cod`. No real Stripe integration despite `@stripe/stripe-js` in front-end.
- `REDIS_URL` env var required (default: `redis://localhost:6379`). Not in `.env.example` — add it manually.

## Front-end (Next.js)

**Commands** (run from `front-end/`):
```bash
npm install
npm run dev
npm run build
npm run lint        # eslint only, no separate type-check script
```

**Critical non-obvious facts:**
- Uses **Next.js 16** with **React 19** — both are bleeding-edge; APIs may differ from training data. Check `node_modules/next/dist/docs/` before writing Next.js-specific code.
- All API calls go through `src/lib/api.ts` typed helpers (`get<T>`, `post<T>`, `put<T>`, `patch<T>`, `del<T>`). Never use `fetch` or `axios` directly in components.
- Auth tokens stored in `localStorage` (`accessToken`, `refreshToken`) AND a `luxe_session=1` cookie. The cookie is required for Next.js middleware route protection (`/account`, `/checkout`). Setting tokens via `useAuthStore.setTokens()` handles both automatically.
- `api.ts` has a built-in 401 → token refresh queue. Concurrent 401s are queued and replayed after refresh — do not add manual refresh logic elsewhere.
- `PaginatedResponse<T>` for products lives in `src/types/product.ts` (has `total_pages`/`current_page`). The one in `src/types/api.ts` is for non-product endpoints (no `total_pages`).
- Cart store (`src/store/cartStore.ts`) is dual-layer: Zustand + `localStorage` (primary) with fire-and-forget Redis sync to backend. Guest cart is localStorage-only (no backend sync).
- `next.config.ts` whitelists only `iljvzwluibwuxyjavpwb.supabase.co` for `next/image`. Adding new image domains requires updating `remotePatterns` there.
- UI components in `src/components/ui/` are shadcn/ui — do not edit them directly; regenerate via `npx shadcn add <component>`.
- Currency is PKR throughout. No i18n/locale system.
