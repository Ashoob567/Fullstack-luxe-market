"""
apps/cart/serializers.py
~~~~~~~~~~~~~~~~~~~~~~~~
Read-only DRF serializers for the Redis-backed cart.

Input is always a plain Python dict coming from CartService —
never a Django model instance — so we extend Serializer directly.
"""

from rest_framework import serializers

from apps.cart.services import CartService


# ---------------------------------------------------------------------------
# Cart item
# ---------------------------------------------------------------------------

class CartItemSerializer(serializers.Serializer):
    """Serialize a single item dict inside the cart's 'items' list."""

    cart_item_id   = serializers.UUIDField(read_only=True)
    product_id     = serializers.UUIDField(read_only=True)
    variant_id     = serializers.UUIDField(read_only=True, allow_null=True)
    name           = serializers.CharField(read_only=True)
    image          = serializers.URLField(read_only=True, allow_blank=True)
    price          = serializers.DecimalField(
                        max_digits=10, decimal_places=2, read_only=True
                     )
    quantity       = serializers.IntegerField(read_only=True)
    size           = serializers.CharField(read_only=True, allow_blank=True)
    color          = serializers.CharField(read_only=True, allow_blank=True)


# ---------------------------------------------------------------------------
# Cart summary
# ---------------------------------------------------------------------------

class CartSummarySerializer(serializers.Serializer):
    """
    Financial breakdown returned by CartService.get_cart_summary().
    Nested inside CartSerializer as a computed field.
    """

    subtotal        = serializers.DecimalField(
                         max_digits=10, decimal_places=2, read_only=True
                      )
    discount_amount = serializers.DecimalField(
                         max_digits=10, decimal_places=2, read_only=True
                      )
    shipping        = serializers.DecimalField(
                         max_digits=10, decimal_places=2, read_only=True
                      )
    total           = serializers.DecimalField(
                         max_digits=10, decimal_places=2, read_only=True
                      )


# ---------------------------------------------------------------------------
# Full cart
# ---------------------------------------------------------------------------

class CartSerializer(serializers.Serializer):
    """
    Serialize the complete cart dict stored in Redis.

    Usage
    -----
        cart   = CartService.get_cart(cart_key)
        data   = CartSerializer(cart).data
    """

    items           = CartItemSerializer(many=True, read_only=True)
    coupon_code     = serializers.CharField(
                         read_only=True,
                         allow_null=True,
                         default=None,
                      )
    discount_amount = serializers.DecimalField(
                         max_digits=10,
                         decimal_places=2,
                         read_only=True,
                         default=0,
                      )
    summary         = serializers.SerializerMethodField()

    def get_summary(self, cart_data: dict) -> dict:
        """
        Call CartService.get_cart_summary() and validate the result
        through CartSummarySerializer before returning it.
        """
        raw_summary = CartService.get_cart_summary(cart_data)
        serializer  = CartSummarySerializer(raw_summary)
        return serializer.data