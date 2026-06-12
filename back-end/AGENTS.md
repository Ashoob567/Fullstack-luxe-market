# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands (run from `back-end/`)

```bash
pip install -r requirements/development.txt
python manage.py runserver
pytest                              # all tests — auto-uses SQLite :memory:
pytest apps/products/tests/         # single app tests
pytest apps/users/tests/test_auth.py::TestClassName::test_method  # single test
black . && isort . && flake8 .
```

## Critical Non-Obvious Facts

- `DJANGO_SETTINGS_MODULE` is NOT set manually — `config/settings/__init__.py` auto-selects by detecting `pytest` in `sys.modules`. Tests always use SQLite `:memory:` automatically.
- Custom user model: `AUTH_USER_MODEL = 'users.CustomUser'` — never use `User` directly; always use `get_user_model()` or `settings.AUTH_USER_MODEL`.
- `ProductImage.image` field uses `storage=get_supabase_storage` (a callable, not an instance) to defer `SupabaseStorage` instantiation — prevents Supabase credentials being required at import time.
- `ProductImage.save()` always regenerates `image_url` from `image.url` — never set `image_url` manually when `image` is set.
- `Product.effective_price` is the canonical price (flash sale → sale → base). `ProductVariant.final_price` = `effective_price + price_modifier`. Never compute price manually.
- Slugs for `Product`, `Category`, `ProductTag` are auto-generated via `pre_save` signals in `apps/products/signals.py` — never set them manually on first save.
- Cart is Redis-backed (`apps/cart/services.py` → `CartService`). Keys: `cart:{user_id}` (7d TTL), `cart:guest:{session_key}` (24h TTL). Payment view clears cart via `cache.delete(f"cart:{user_id}")` after order creation.
- Shipping constants defined in TWO places: `apps/cart/services.py` and `apps/payments/views.py` — keep in sync (free ≥ PKR 3000, flat PKR 200 below).
- Payment is mock-only (`apps/payments/mock_processor.py`). Valid `payment_method` values: `mock_card` or `cod`. No real Stripe.
- `REDIS_URL` env var is required but NOT in `.env.example` — add `REDIS_URL=redis://localhost:6379` manually.
- Tests set dummy Supabase env vars (`SUPABASE_URL`, `SUPABASE_KEY`) in `config/settings/development.py` — storage is never actually called in tests.
- `apps/coupons` has no `tests/` directory and no URL registration — it is used only as a dependency of `CartService`.
