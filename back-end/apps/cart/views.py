"""
apps/cart/views.py
~~~~~~~~~~~~~~~~~~
DRF APIView-based views for the Luxe Market cart.

Cart key resolution
-------------------
  Authenticated  →  cart:{user.id}
  Guest          →  cart:guest:{session_key}
"""

from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.cart.services import CartService
from apps.cart.serializers import CartSerializer


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------

def _get_cart_key(request) -> str:
    """
    Return the Redis cart key for the current request.

    For guests, ensure a session exists before reading session_key —
    Django does not persist a session until something is written to it
    or create() is called explicitly.
    """
    if request.user.is_authenticated:
        return f"cart:{request.user.id}"

    if not request.session.session_key:
        request.session.create()

    return f"cart:guest:{request.session.session_key}"


def _cart_response(cart: dict, extra: dict | None = None, status_code: int = status.HTTP_200_OK) -> Response:
    """Serialize *cart* and merge in any *extra* top-level fields."""
    data = CartSerializer(cart).data
    if extra:
        data = {**data, **extra}
    return Response(data, status=status_code)


# ---------------------------------------------------------------------------
# 1. CartView  —  GET /api/cart/
# ---------------------------------------------------------------------------

class CartView(APIView):
    """Return the current cart for the authenticated user or guest."""

    permission_classes = [AllowAny]

    def get(self, request):
        cart_key = _get_cart_key(request)
        cart = CartService.get_cart(cart_key)
        return _cart_response(cart)


# ---------------------------------------------------------------------------
# 2. AddToCartView  —  POST /api/cart/add/
# ---------------------------------------------------------------------------

class AddToCartView(APIView):
    """
    Add a product variant to the cart.

    Expected body
    -------------
    {
        "product_id": "<uuid>",
        "variant_id": "<uuid>",
        "quantity":   <int>
    }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        product_id = request.data.get("product_id")
        variant_id = request.data.get("variant_id")
        quantity   = request.data.get("quantity")

        # Basic presence validation
        missing = [f for f, v in [
            ("product_id", product_id),
            ("variant_id", variant_id),
            ("quantity",   quantity),
        ] if not v]

        if missing:
            return Response(
                {"error": f"Missing required field(s): {', '.join(missing)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "quantity must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_key = _get_cart_key(request)

        try:
            cart = CartService.add_item(cart_key, product_id, variant_id, quantity)
        except (ValueError, DjangoValidationError) as exc:
            # DjangoValidationError is raised when product_id/variant_id are not valid UUIDs
            msg = exc.messages[0] if isinstance(exc, DjangoValidationError) else str(exc)
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

        return _cart_response(
            cart,
            extra={"message": "Item added to cart."},
            status_code=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 3. UpdateCartItemView  —  PUT /api/cart/update/<cart_item_id>/
# ---------------------------------------------------------------------------

class UpdateCartItemView(APIView):
    """
    Update the quantity of an existing cart line.

    Expected body
    -------------
    { "quantity": <int> }
    """

    permission_classes = [AllowAny]

    def put(self, request, cart_item_id: str):
        quantity = request.data.get("quantity")

        if quantity is None:
            return Response(
                {"error": "Missing required field: quantity."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "quantity must be a valid integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_key = _get_cart_key(request)

        try:
            cart = CartService.update_item(cart_key, cart_item_id, quantity)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return _cart_response(cart)


# ---------------------------------------------------------------------------
# 4. RemoveCartItemView  —  DELETE /api/cart/remove/<cart_item_id>/
# ---------------------------------------------------------------------------

class RemoveCartItemView(APIView):
    """Remove a single line item from the cart."""

    permission_classes = [AllowAny]

    def delete(self, request, cart_item_id: str):
        cart_key = _get_cart_key(request)

        try:
            cart = CartService.remove_item(cart_key, cart_item_id)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return _cart_response(cart)


# ---------------------------------------------------------------------------
# 5. ClearCartView  —  DELETE /api/cart/clear/
# ---------------------------------------------------------------------------

class ClearCartView(APIView):
    """Wipe the entire cart from Redis."""

    permission_classes = [AllowAny]

    def delete(self, request):
        cart_key = _get_cart_key(request)
        CartService.clear_cart(cart_key)
        return Response({"cleared": True}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# 6. ApplyCouponView  —  POST /api/cart/coupon/
# ---------------------------------------------------------------------------

class ApplyCouponView(APIView):
    """
    Apply a coupon code to the cart.

    Expected body
    -------------
    { "coupon_code": "<string>" }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        coupon_code = request.data.get("coupon_code", "").strip()

        if not coupon_code:
            return Response(
                {"error": "Missing required field: coupon_code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_key = _get_cart_key(request)

        try:
            cart = CartService.apply_coupon(cart_key, coupon_code)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return _cart_response(
            cart,
            extra={"message": f"Coupon '{coupon_code}' applied successfully."},
        )


# ---------------------------------------------------------------------------
# 7. MergeCartView  —  POST /api/cart/merge/
# ---------------------------------------------------------------------------

class MergeCartView(APIView):
    """
    Merge a guest cart into the authenticated user's cart.

    Requires JWT (or session) authentication — user must be logged in.

    The guest key is resolved in this priority order:
      1. Explicit ``guest_key`` field in the request body.
      2. ``cart:guest:{session_key}`` derived from the current session.

    Expected body (optional)
    ------------------------
    { "guest_key": "cart:guest:<session_key>" }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_key = f"cart:{request.user.id}"

        # Resolve guest key — body takes priority over session
        guest_key = request.data.get("guest_key", "").strip()

        if not guest_key:
            session_key = request.session.session_key
            if not session_key:
                return Response(
                    {"error": "No guest cart found. Provide guest_key in the request body or ensure a valid session exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            guest_key = f"cart:guest:{session_key}"

        # Refuse to merge a cart into itself
        if guest_key == user_key:
            return Response(
                {"error": "guest_key and user cart key must be different."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            merged_cart = CartService.merge_carts(guest_key, user_key)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return _cart_response(
            merged_cart,
            extra={"message": "Guest cart merged successfully."},
        )

# ---------------------------------------------------------------------------
# 8. RemoveCouponView  —  DELETE /api/cart/coupon/remove/
# ---------------------------------------------------------------------------

class RemoveCouponView(APIView):
    """
    Remove the currently applied coupon from the cart.

    Works for both authenticated users and guests.
    Returns the updated cart so the front-end can refresh totals in one round-trip.
    """

    permission_classes = [AllowAny]

    def delete(self, request):
        cart_key = _get_cart_key(request)

        try:
            cart = CartService.remove_coupon(cart_key)
        except Exception as exc:  # pragma: no cover — defensive catch-all
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return _cart_response(
            cart,
            extra={"message": "Coupon removed successfully."},
        )