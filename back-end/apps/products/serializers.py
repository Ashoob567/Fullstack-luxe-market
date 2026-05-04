from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductImage,
    ProductTag,
    ProductVariant,
    Review,
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
        fields = [
            "id",
            "name",
            "slug",
        ]


# ==================================================
# PRODUCT IMAGE
# ==================================================

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "url",
            "alt_text",
            "is_primary",
            "order",
        ]

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
            "final_price",
            "is_in_stock",
        ]


# ==================================================
# PRODUCT LIST / CARD
# ==================================================

class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()

    discount_percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    is_on_sale = serializers.BooleanField(read_only=True)

    # =========================
    # FLASH SALE FIELDS (NEW)
    # =========================
    is_flash_sale = serializers.BooleanField(read_only=True)
    flash_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flash_sale_ends_at = serializers.DateTimeField(
        read_only=True,
        allow_null=True,
    )
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
    is_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "base_price",
            "sale_price",
            "discount_percentage",
            "is_on_sale",

            # FLASH SALE
            "is_flash_sale",
            "flash_sale_price",
            "flash_sale_ends_at",
            "is_flash_active",

            "is_featured",
            "primary_image",
            "category_id",
            "category_name",
            "average_rating",
            "is_in_stock",
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()

        if primary:
            return primary.image_url or (
                primary.image.url if primary.image else None
            )

        first = obj.images.first()

        if first:
            return first.image_url or (
                first.image.url if first.image else None
            )

        return None

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_is_in_stock(self, obj):
        return obj.variants.filter(stock_qty__gt=0).exists()


# ==================================================
# PRODUCT DETAIL
# ==================================================
class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    tags = ProductTagSerializer(many=True, read_only=True)

    # FLASH SALE (NEW)
    is_flash_sale = serializers.BooleanField(read_only=True)
    flash_sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    flash_sale_ends_at = serializers.DateTimeField(
        read_only=True,
        allow_null=True,
    )
    is_flash_active = serializers.BooleanField(read_only=True)

    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

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

            # FLASH SALE
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
            "average_rating",
            "review_count",
        ]

    def get_average_rating(self, obj):
        return getattr(obj, "average_rating", None)

    def get_review_count(self, obj):
        return getattr(obj, "review_count", 0)