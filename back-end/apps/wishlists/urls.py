from django.urls import path
from .views import (
    WishlistListView,
    WishlistToggleView,
    WishlistStatusView,
    WishlistBulkStatusView,
    WishlistClearView,
)

app_name = "wishlists"

urlpatterns = [
    # GET    /api/wishlist/              → all wishlist items (with product details)
    path("", WishlistListView.as_view(), name="wishlist-list"),

    # POST   /api/wishlist/toggle/       → add or remove (heart icon toggle)
    path("toggle/", WishlistToggleView.as_view(), name="wishlist-toggle"),

    # GET    /api/wishlist/status/       → is one product wishlisted?
    path("status/", WishlistStatusView.as_view(), name="wishlist-status"),

    # POST   /api/wishlist/bulk-status/  → are multiple products wishlisted?
    path("bulk-status/", WishlistBulkStatusView.as_view(), name="wishlist-bulk-status"),

    # DELETE /api/wishlist/clear/        → clear entire wishlist
    path("clear/", WishlistClearView.as_view(), name="wishlist-clear"),
]
