import uuid
import logging
from django.utils import timezone

from django.db import models
from django.conf import settings


def get_supabase_storage():
    """Return a SupabaseStorage instance for use in model fields."""
    from utils.storage import SupabaseStorage
    return SupabaseStorage()





class ProductTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Product Tag"
        verbose_name_plural = "Product Tags"

    def __str__(self):
        return self.name


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=110, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/",storage=get_supabase_storage, null=True, blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        indexes = [
            models.Index(fields=['slug'], name='cat_slug_idx'),
            models.Index(fields=['is_active'], name='cat_active_idx'),
        ]

    def __str__(self):
        return self.name


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=210, unique=True, blank=True)
    description = models.TextField()

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products",
    )

    base_price = models.DecimalField(max_digits=10, decimal_places=2)

    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # =========================
    # FLASH SALE FIELDS (NEW)
    # =========================
    is_flash_sale = models.BooleanField(default=False)

    flash_sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    flash_sale_ends_at = models.DateTimeField(
        null=True,
        blank=True
    )

    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    tags = models.ManyToManyField(
        ProductTag,
        blank=True,
        related_name="products"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Product"
        verbose_name_plural = "Products"
        indexes = [
            models.Index(fields=['is_active', '-created_at'], name='prod_active_created_idx'),
            models.Index(fields=['is_active', 'is_featured'], name='prod_active_featured_idx'),
            models.Index(fields=['is_active', 'is_flash_sale'], name='prod_active_flash_idx'),
            models.Index(fields=['category', 'is_active'], name='prod_cat_active_idx'),
            models.Index(fields=['slug'], name='prod_slug_idx'),
        ]

    def __str__(self):
        return self.name

    # =========================
    # DISCOUNT LOGIC
    # =========================
    @property
    def discount_percentage(self):
        if self.sale_price and self.sale_price < self.base_price:
            discount = self.base_price - self.sale_price
            return round((discount / self.base_price) * 100, 2)
        return 0

    @property
    def is_on_sale(self):
        return (
            self.sale_price is not None
            and self.sale_price < self.base_price
        )

    # =========================
    # FLASH SALE LOGIC (NEW)
    # =========================
    @property
    def is_flash_active(self):

        if not self.is_flash_sale:
            return False

        if self.flash_sale_ends_at and self.flash_sale_ends_at < timezone.now():
            return False

        return True

    @property
    def computed_price(self):
        """
        Final price used everywhere (frontend + backend)
        """
        if self.is_flash_active and self.flash_sale_price:
            return self.flash_sale_price

        return self.sale_price or self.base_price


# ==================================================
# DEPRECATED MODELS - Removed (use ProductColorVariant + ProductSizeVariant)
# - ProductImage (old image structure)
# - ProductVariant (old flat variant structure)
# ==================================================

class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [ models.UniqueConstraint(fields=["product", "user"],name="unique_product_review_per_user")]
        ordering = ["-created_at"]
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self):
        return f"{self.user} — {self.product.name} ({self.rating}★)"


# ==================================================
# DEPRECATED: ProductVariantV2 - Removed (denormalized, duplicates images)
# Use ProductColorVariant + ProductSizeVariant instead
# ==================================================


# ==================================================
# CURRENT STRUCTURE - Normalized (RECOMMENDED) ✨
# Product → ColorVariant (with image) → SizeVariant
# ==================================================


class ProductColorVariant(models.Model):
    """
    Represents a color variant of a product with its image and hex codes.

    Example:
    - Product: "Cotton Shirt"
    - ColorVariant: Red (with image, hex codes, and sizes)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="color_variants_new",
    )

    # Color Information
    color_name = models.CharField(
        max_length=50,
        help_text="Display name: 'Cobalt Indigo', 'Lagoon', 'Peach'"
    )

    # Hex Color Codes for UI
    hex_primary = models.CharField(
        max_length=7,
        help_text="Primary color hex: #5B6EF5"
    )
    hex_light = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Light shade for hover effects (optional)"
    )
    hex_dark = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Dark shade for borders (optional)"
    )

    # Image directly attached to this color
    image = models.ImageField(
        upload_to="products/colors/",
        storage=get_supabase_storage,
        help_text="Image showing this specific color variant"
    )
    image_url = models.CharField(
        max_length=500,
        blank=True,
        default="",
        help_text="Auto-generated public URL"
    )

    # Metadata
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which colors appear (0 = first)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'color_name']
        verbose_name = "Product Color Variant"
        verbose_name_plural = "Product Color Variants"
        unique_together = ['product', 'color_name']
        indexes = [
            models.Index(fields=['product', 'is_active'], name='color_prod_active_idx'),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.color_name}"

    def save(self, *args, **kwargs):
        """Auto-generate image_url from image field after upload."""
        if self.image and self.image.name:
            try:
                url = self.image.url
                if isinstance(url, dict):
                    url = url.get("publicUrl") or url.get("data", {}).get("publicUrl", "")
                if url and url.strip():
                    self.image_url = url
                else:
                    self.image_url = ""
            except Exception as e:
                logger.error(f"Error getting image URL: {e}")
                self.image_url = ""
        elif not self.image:
            self.image_url = ""
        super().save(*args, **kwargs)

    @property
    def total_stock(self):
        """Total stock across all sizes for this color."""
        return self.size_variants.aggregate(
            total=models.Sum('stock_quantity')
        )['total'] or 0

    @property
    def is_in_stock(self):
        """Check if any size variant has stock."""
        return self.size_variants.filter(stock_quantity__gt=0).exists()

    @property
    def available_sizes(self):
        """Get all sizes that have stock."""
        return self.size_variants.filter(
            stock_quantity__gt=0,
            is_active=True
        ).order_by('display_order')


class ProductSizeVariant(models.Model):
    """
    Represents a size option within a specific color variant.

    Example:
    - ColorVariant: Red Shirt
    - SizeVariant: Medium (stock: 10, SKU: SHIRT-RED-M)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    color_variant = models.ForeignKey(
        ProductColorVariant,
        on_delete=models.CASCADE,
        related_name="size_variants",
    )

    # Size Information
    size_name = models.CharField(
        max_length=20,
        help_text="Size label: 'S', 'M', 'L', 'XL', '40', '41', etc."
    )

    # Inventory
    sku = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique SKU for this exact variant"
    )
    stock_quantity = models.PositiveIntegerField(
        default=0,
        help_text="Current stock level"
    )

    # Pricing (optional - if size affects price)
    price_adjustment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Price adjustment for this size (can be negative)"
    )

    # Metadata
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which sizes appear (0 = first)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'size_name']
        verbose_name = "Product Size Variant"
        verbose_name_plural = "Product Size Variants"
        unique_together = ['color_variant', 'size_name']
        indexes = [
            models.Index(fields=['sku'], name='size_sku_idx'),
            models.Index(fields=['color_variant', 'stock_quantity'], name='size_color_stock_idx'),
        ]

    def __str__(self):
        return f"{self.color_variant.color_name} - {self.size_name} ({self.sku})"

    @property
    def is_in_stock(self):
        """Check if this size has stock."""
        return self.stock_quantity > 0

    @property
    def final_price(self):
        """Calculate final price with size adjustment."""
        base_price = self.color_variant.product.computed_price
        return base_price + self.price_adjustment