from rest_framework import serializers
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer
from .models import Wishlist


class WishlistItemSerializer(serializers.ModelSerializer):
    """
    Serializer for reading wishlist items.
    Returns full product details using the existing ProductListSerializer
    so the frontend gets the same product shape as the product listing page.
    """
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "product", "created_at"]
        read_only_fields = ["id", "created_at"]


class WishlistToggleSerializer(serializers.Serializer):
    """
    Serializer for the toggle endpoint.
    Validates that product_id exists and is active before toggling.
    """
    product_id = serializers.UUIDField()

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError(
                "Product not found or is no longer available."
            )
        return value


class WishlistBulkStatusSerializer(serializers.Serializer):
    """
    Serializer for bulk status check.
    Accepts a list of product UUIDs and returns their wishlist status.
    Used when rendering product grids — one call instead of N calls.
    """
    product_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        max_length=100,  # prevent abuse — max 100 IDs per request
    )
