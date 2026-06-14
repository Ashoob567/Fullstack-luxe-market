from django.utils import timezone
from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductImage,
    ProductTag,
    ProductVariant,
    Review,
    ProductVariantV2,  # NEW unified variant
    ProductColorVariant,  # OLD nested structure
    ProductSizeVariant,   # OLD nested structure
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
# PRODUCT IMAGE
# ==================================================

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "url", "alt_text", "color", "is_primary", "order"]

    def get_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            try:
                return obj.image.url
            except Exception:
                return None
        return None


# ==================================================
# PRODUCT VARIANT
# ==================================================

class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "size",
            "color",
            "stock_qty",
            "price_modifier",
            "final_price",
            "is_in_stock",
        ]


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

class ProductListSerializer(EffectivePriceMixin, serializers.ModelSerializer):
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
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url or (primary.image.url if primary.image else None)
        first = obj.images.first()
        if first:
            return first.image_url or (first.image.url if first.image else None)
        return None

    def get_images(self, obj):
        """Return all product images with their color associations"""
        return ProductImageSerializer(obj.images.all(), many=True).data

    def get_color_variants(self, obj):
        """
        Group variants by color with their available sizes.
        Returns a list of color objects with sizes and stock info.
        Only includes colors that have stock available.
        """
        from collections import defaultdict

        color_data = defaultdict(lambda: {
            'sizes': [],
            'in_stock': False
        })

        # Group variants by color
        for variant in obj.variants.filter(stock_qty__gt=0):
            color = variant.color or 'Default'
            size = variant.size or 'Standard'

            color_data[color]['sizes'].append({
                'size': size,
                'variant_id': str(variant.id),
                'sku': variant.sku,
                'stock_qty': variant.stock_qty,
                'price_modifier': str(variant.price_modifier),
                'final_price': str(variant.final_price),
            })
            color_data[color]['in_stock'] = True

        # Format for frontend consumption
        result = []
        for color_name, data in color_data.items():
            # Find matching image for this color
            color_image = obj.images.filter(color__iexact=color_name).first()
            if not color_image:
                # Fallback to primary or first image
                color_image = obj.images.filter(is_primary=True).first() or obj.images.first()

            image_url = None
            if color_image:
                image_url = color_image.image_url or (color_image.image.url if color_image.image else None)

            result.append({
                'color': color_name,
                'image_url': image_url,
                'sizes': data['sizes'],
                'in_stock': data['in_stock']
            })

        return result

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

    def get_is_in_stock(self, obj):
        return obj.variants.filter(stock_qty__gt=0).exists()


# ==================================================
# PRODUCT DETAIL
# ==================================================

class ProductDetailSerializer(EffectivePriceMixin, serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
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
        return obj.variants.filter(stock_qty__gt=0).exists()

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url or (primary.image.url if primary.image else None)
        first = obj.images.first()
        if first:
            return first.image_url or (first.image.url if first.image else None)
        return None

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

# ==================================================
# UNIFIED VARIANT SERIALIZER (NEW - Recommended!) ✨
# Product → VariantV2 (color + size + image in one)
# ==================================================

class ProductVariantV2Serializer(serializers.ModelSerializer):
    """
    Serializer for unified variant structure.
    Returns all variant data (color, size, image) in a flat structure.
    """
    is_in_stock = serializers.BooleanField(read_only=True)
    final_price = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariantV2
        fields = [
            'id',
            'color_name',
            'hex_primary',
            'hex_light',
            'hex_dark',
            'image_url',
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

    def get_image_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            try:
                return obj.image.url
            except Exception:
                return None
        return None


class ProductListSerializerV2(EffectivePriceMixin, serializers.ModelSerializer):
    """
    Product list serializer using UNIFIED variant structure.
    Returns variants_v2 with complete color + size + image data in flat structure.

    This is the RECOMMENDED serializer for new implementations!
    """
    primary_image = serializers.SerializerMethodField()
    variants = ProductVariantV2Serializer(source='variants_v2', many=True, read_only=True)
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
        """Get primary image from first variant."""
        first_variant = obj.variants_v2.filter(is_active=True).first()
        if first_variant:
            return first_variant.image_url or (first_variant.image.url if first_variant.image else None)
        return None

    def get_colors(self, obj):
        """
        Return unique colors with their hex codes and primary image.
        Frontend can use this for color selector swatches.
        """
        from collections import OrderedDict

        colors = OrderedDict()
        for variant in obj.variants_v2.filter(is_active=True, stock_quantity__gt=0).order_by('display_order'):
            if variant.color_name not in colors:
                colors[variant.color_name] = {
                    'color_name': variant.color_name,
                    'hex_primary': variant.hex_primary,
                    'hex_light': variant.hex_light,
                    'hex_dark': variant.hex_dark,
                    'image_url': variant.image_url or (variant.image.url if variant.image else None),
                    'in_stock': True,
                }

        return list(colors.values())

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

    def get_is_in_stock(self, obj):
        """Check if any variant has stock."""
        return obj.variants_v2.filter(stock_quantity__gt=0, is_active=True).exists()


# ==================================================
# OLD NESTED STRUCTURE SERIALIZERS (DEPRECATED)
# Product → ColorVariant → SizeVariant
# ==================================================


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

        # Fallback to old structure
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url or (primary.image.url if primary.image else None)
        first = obj.images.first()
        if first:
            return first.image_url or (first.image.url if first.image else None)
        return None

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)

    def get_is_in_stock(self, obj):
        """Check if any color variant has stock."""
        has_new_stock = obj.color_variants_new.filter(
            size_variants__stock_quantity__gt=0
        ).exists()

        if has_new_stock:
            return True

        # Fallback to old structure
        return obj.variants.filter(stock_qty__gt=0).exists()
