from django.utils import timezone
from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductTag,
    Review,
    ProductColorVariant,
    ProductSizeVariant,
)


# ==================================================
# CATEGORY
# ==================================================

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_id = serializers.UUIDField(source="parent.id", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "image",
            "parent_id",
            "children",
            "is_active",
            "created_at",
        ]

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategorySerializer(children, many=True).data


# ==================================================
# PRODUCT TAG
# ==================================================

class ProductTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTag
        fields = ["id", "name", "slug"]


# ==================================================
# DEPRECATED SERIALIZERS - Removed
# - ProductImageSerializer (use ProductColorVariant.image_url)
# - ProductVariantSerializer (use ProductSizeVariantSerializer)
# ==================================================


# ==================================================
# REVIEW
# ==================================================

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "product",
            "user",
            "user_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def get_user_name(self, obj):
        return (
            f"{obj.user.first_name} {obj.user.last_name}".strip()
            or obj.user.email
        )


# ==================================================
# SHARED MIXIN — effective_price logic in one place
# ==================================================

class EffectivePriceMixin:
    """
    Single source of truth for effective_price calculation in serializers.

    FIX: Previously both models.py and serializers.py computed effective_price
    independently, with duplicate timezone imports scattered across methods.
    Now all serializers inherit this mixin so the logic lives in ONE place.

    Priority: flash_sale_price > sale_price > base_price
    """
    def get_effective_price(self, obj):
        if (
            obj.is_flash_sale
            and obj.flash_sale_price is not None
            and (
                obj.flash_sale_ends_at is None
                or obj.flash_sale_ends_at > timezone.now()
            )
        ):
            return str(obj.flash_sale_price)
        if obj.sale_price is not None:
            return str(obj.sale_price)
        return str(obj.base_price)


# ==================================================
# PRODUCT LIST / CARD
# ==================================================

# ==================================================
# DEPRECATED: ProductListSerializer (uses old ProductImage/ProductVariant)
# Use ProductListSerializerNew instead
# ==================================================
'''
class ProductListSerializer(EffectivePriceMixin, serializers.ModelSerializer):
    """DEPRECATED: Use ProductListSerializerNew which uses ProductColorVariant structure"""
    primary_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    color_variants = serializers.SerializerMethodField()
    tags = ProductTagSerializer(many=True, read_only=True)  # Product tags for badges

    discount_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    is_on_sale = serializers.BooleanField(read_only=True)

    # Flash Sale
    is_flash_sale = serializers.BooleanField(read_only=True)
    flash_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flash_sale_ends_at = serializers.DateTimeField(read_only=True, allow_null=True)
    is_flash_active = serializers.BooleanField(read_only=True)

    category_id = serializers.UUIDField(
        source="category.id",
        read_only=True,
        allow_null=True,
    )
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()

    # FIX: SerializerMethodField — reads from Python logic, never from a DB
    # annotation. No risk of name collision with any ORM annotation.
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "base_price",
            "sale_price",
            "effective_price",
            "discount_percentage",
            "is_on_sale",
            # Flash Sale
            "is_flash_sale",
            "flash_sale_price",
            "flash_sale_ends_at",
            "is_flash_active",
            "is_featured",
            "is_active",
            "primary_image",
            "images",
            "color_variants",
            "tags",  # Product tags for badges (NEW ARRIVAL, SALE, etc.)
            "category_id",
            "category_name",
            "average_rating",
            "review_count",
            "is_in_stock",
        ]

    def get_primary_image(self, obj):
        # DEPRECATED: obj.images relation no longer exists
        return None

    def get_images(self, obj):
        # DEPRECATED: obj.images relation no longer exists
        return []

    def get_color_variants(self, obj):
        # DEPRECATED: obj.variants relation no longer exists
        return []

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

    def get_is_in_stock(self, obj):
        # DEPRECATED: obj.variants relation no longer exists
        return False

'''
# ==================================================
# DEPRECATED: ProductDetailSerializer (uses old ProductImage/ProductVariant)
# Frontend now uses ProductListSerializerNew for detail pages
# ==================================================

class ProductDetailSerializer(EffectivePriceMixin, serializers.ModelSerializer):
    """DEPRECATED: Frontend uses ProductListSerializerNew which includes color_variants_new"""
    category = CategorySerializer(read_only=True)
    tags = ProductTagSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    discount_percentage = serializers.FloatField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)

    # Flash Sale
    is_flash_sale = serializers.BooleanField(read_only=True)
    flash_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flash_sale_ends_at = serializers.DateTimeField(read_only=True, allow_null=True)
    is_flash_active = serializers.BooleanField(read_only=True)

    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    # FIX: SerializerMethodField — inherited from EffectivePriceMixin
    effective_price = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "base_price",
            "sale_price",
            "effective_price",
            "discount_percentage",
            "is_on_sale",
            # Flash Sale
            "is_flash_sale",
            "flash_sale_price",
            "flash_sale_ends_at",
            "is_flash_active",
            "is_featured",
            "is_active",
            "tags",
            "created_at",
            "updated_at",
            "images",
            "variants",
            "primary_image",
            "average_rating",
            "review_count",
            "is_in_stock",
            "reviews",
        ]

    def get_is_in_stock(self, obj):
        # DEPRECATED: obj.variants relation no longer exists
        return False

    def get_primary_image(self, obj):
        # DEPRECATED: obj.images relation no longer exists
        return None

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

# ==================================================
# DEPRECATED: ProductVariantV2Serializer (denormalized structure)
# Use ProductColorVariantSerializer + ProductSizeVariantSerializer
# ==================================================


# ==================================================
# DEPRECATED: ProductListSerializerV2 (uses ProductVariantV2 - denormalized)
# Use ProductListSerializerNew instead
# ==================================================
''''
class ProductListSerializerV2(EffectivePriceMixin, serializers.ModelSerializer):
    """DEPRECATED: Use ProductListSerializerNew which uses normalized ProductColorVariant structure"""
    primary_image = serializers.SerializerMethodField()
    colors = serializers.SerializerMethodField()

    discount_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    is_on_sale = serializers.BooleanField(read_only=True)

    # Flash Sale
    is_flash_sale = serializers.BooleanField(read_only=True)
    flash_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flash_sale_ends_at = serializers.DateTimeField(read_only=True, allow_null=True)
    is_flash_active = serializers.BooleanField(read_only=True)

    category_id = serializers.UUIDField(
        source="category.id",
        read_only=True,
        allow_null=True,
    )
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "base_price",
            "sale_price",
            "effective_price",
            "discount_percentage",
            "is_on_sale",
            # Flash Sale
            "is_flash_sale",
            "flash_sale_price",
            "flash_sale_ends_at",
            "is_flash_active",
            "is_featured",
            "is_active",
            "primary_image",
            "variants",  # All variants (flat structure)
            "colors",    # Grouped by color (for color selector)
            "category_id",
            "category_name",
            "average_rating",
            "review_count",
            "is_in_stock",
        ]

    def get_primary_image(self, obj):
        # DEPRECATED: obj.variants_v2 relation no longer exists
        return None

    def get_colors(self, obj):
        # DEPRECATED: obj.variants_v2 relation no longer exists
        return []

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

    def get_is_in_stock(self, obj):
        # DEPRECATED: obj.variants_v2 relation no longer exists
        return False


# ==================================================
# OLD NESTED STRUCTURE SERIALIZERS (DEPRECATED)
# Product → ColorVariant → SizeVariant
# ==================================================
'''

class ProductSizeVariantSerializer(serializers.ModelSerializer):
    """Serializer for size variants within a color."""
    is_in_stock = serializers.BooleanField(read_only=True)
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = ProductSizeVariant
        fields = [
            'id',
            'size_name',
            'sku',
            'stock_quantity',
            'price_adjustment',
            'is_in_stock',
            'final_price',
            'display_order',
        ]

    def get_final_price(self, obj):
        return str(obj.final_price)


class ProductColorVariantSerializer(serializers.ModelSerializer):
    """Serializer for color variants with their sizes."""
    size_variants = ProductSizeVariantSerializer(many=True, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    total_stock = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductColorVariant
        fields = [
            'id',
            'color_name',
            'hex_primary',
            'hex_light',
            'hex_dark',
            'image_url',
            'size_variants',
            'is_in_stock',
            'total_stock',
            'display_order',
        ]

    def get_image_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            try:
                return obj.image.url
            except Exception:
                return None
        return None


class ProductListSerializerNew(EffectivePriceMixin, serializers.ModelSerializer):
    """
    Product list serializer using NEW structure.
    Returns color_variants_new with direct image and size relationships.
    """
    primary_image = serializers.SerializerMethodField()
    color_variants_new = ProductColorVariantSerializer(many=True, read_only=True)
    tags = ProductTagSerializer(many=True, read_only=True)  # Product tags for badges

    discount_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    is_on_sale = serializers.BooleanField(read_only=True)

    # Flash Sale
    is_flash_sale = serializers.BooleanField(read_only=True)
    flash_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flash_sale_ends_at = serializers.DateTimeField(read_only=True, allow_null=True)
    is_flash_active = serializers.BooleanField(read_only=True)

    category_id = serializers.UUIDField(
        source="category.id",
        read_only=True,
        allow_null=True,
    )
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    effective_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "base_price",
            "sale_price",
            "effective_price",
            "discount_percentage",
            "is_on_sale",
            # Flash Sale
            "is_flash_sale",
            "flash_sale_price",
            "flash_sale_ends_at",
            "is_flash_active",
            "is_featured",
            "is_active",
            "primary_image",
            "color_variants_new",  # NEW!
            "tags",  # Product tags for badges (NEW ARRIVAL, SALE, etc.)
            "category_id",
            "category_name",
            "average_rating",
            "review_count",
            "is_in_stock",
        ]

    def get_primary_image(self, obj):
        """Get primary image from first color variant."""
        first_color = obj.color_variants_new.filter(is_active=True).first()
        if first_color:
            return first_color.image_url or (first_color.image.url if first_color.image else None)

        # No fallback - old structure removed
        return None

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

    def get_is_in_stock(self, obj):
        """Check if any color variant has stock."""
        return obj.color_variants_new.filter(
            size_variants__stock_quantity__gt=0
        ).exists()
