# Wishlist App — Integration Steps
# Yeh 3 files manually update karni hain project mein

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — back-end/config/settings/base.py
# ─────────────────────────────────────────────────────────────────────────────
# INSTALLED_APPS mein add karo:

INSTALLED_APPS = [
    # ... existing apps ...
    "apps.cart",
    "apps.coupons",
    "apps.orders",
    "apps.payments",
    "apps.products",
    "apps.users",
    "apps.wishlists",   # ← ADD THIS
]

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — back-end/config/urls.py
# ─────────────────────────────────────────────────────────────────────────────
# urlpatterns mein add karo:

from django.urls import path, include

urlpatterns = [
    # ... existing urls ...
    path("api/wishlist/", include("apps.wishlists.urls")),   # ← ADD THIS
]

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Run migrations
# ─────────────────────────────────────────────────────────────────────────────

# Terminal mein run karo:
cd back-end
python manage.py makemigrations wishlists
python manage.py migrate

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Delete the old wrong file
# ─────────────────────────────────────────────────────────────────────────────
# apps/wishlists/seriallizer.py   ← DELETE (typo — double l)
# Replace with the new serializers.py from this package

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Run tests
# ─────────────────────────────────────────────────────────────────────────────

python manage.py test apps.wishlists --verbosity=2

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Verify all 5 endpoints work
# ─────────────────────────────────────────────────────────────────────────────

# GET    http://localhost:8000/api/wishlist/
# POST   http://localhost:8000/api/wishlist/toggle/
# GET    http://localhost:8000/api/wishlist/status/?product_id=<uuid>
# POST   http://localhost:8000/api/wishlist/bulk-status/
# DELETE http://localhost:8000/api/wishlist/clear/
