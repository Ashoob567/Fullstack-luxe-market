"""
apps/cart/urls.py
~~~~~~~~~~~~~~~~~
URL routes for the Luxe Market cart.
Mounted at /api/cart/ via config/urls.py.
"""

from django.urls import path

from apps.cart.views import (
    CartView,
    AddToCartView,
    UpdateCartItemView,
    RemoveCartItemView,
    ClearCartView,
    ApplyCouponView,
    RemoveCouponView,
    MergeCartView,
)

app_name = "cart"

urlpatterns = [
    # GET    /api/cart/
    path("", CartView.as_view(), name="cart-detail"),

    # POST   /api/cart/add/
    path("add/", AddToCartView.as_view(), name="cart-add"),

    # PUT    /api/cart/update/<cart_item_id>/
    path("update/<str:cart_item_id>/", UpdateCartItemView.as_view(), name="cart-update"),

    # DELETE /api/cart/remove/<cart_item_id>/
    path("remove/<str:cart_item_id>/", RemoveCartItemView.as_view(), name="cart-remove"),

    # DELETE /api/cart/clear/
    path("clear/", ClearCartView.as_view(), name="cart-clear"),

    # POST   /api/cart/coupon/        — apply a coupon
    # DELETE /api/cart/coupon/remove/ — remove the applied coupon
    path("coupon/", ApplyCouponView.as_view(), name="cart-coupon"),
    path("coupon/remove/", RemoveCouponView.as_view(), name="cart-coupon-remove"),

    # POST   /api/cart/merge/
    path("merge/", MergeCartView.as_view(), name="cart-merge"),
]