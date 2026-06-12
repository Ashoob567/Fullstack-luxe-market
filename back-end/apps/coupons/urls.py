from django.urls import path
from .views import (
    CouponValidateView,
    CouponPublicListView,
    CouponUsageHistoryView,
    AdminCouponCreateView,
    AdminCouponStatsView,
)

app_name = "coupons"

urlpatterns = [
    # ── User-facing endpoints ─────────────────────────────────────────────────

    # POST /api/coupons/validate/
    # Apply/validate a coupon code — used by cart "Apply Coupon" button
    path("validate/", CouponValidateView.as_view(), name="coupon-validate"),

    # GET /api/coupons/active/
    # List all currently valid coupons — shown as "Available offers" in cart
    path("active/", CouponPublicListView.as_view(), name="coupon-active-list"),

    # GET /api/coupons/my-usage/
    # Current user's coupon usage history
    path("my-usage/", CouponUsageHistoryView.as_view(), name="coupon-usage-history"),

    # ── Admin-only endpoints ──────────────────────────────────────────────────

    # POST /api/coupons/admin/create/
    path("admin/create/", AdminCouponCreateView.as_view(), name="coupon-admin-create"),

    # GET /api/coupons/admin/stats/<code>/
    path("admin/stats/<str:code>/", AdminCouponStatsView.as_view(), name="coupon-admin-stats"),
]