import uuid
import logging
from django.utils import timezone

from django.db import models
from django.conf import settings


def get_supabase_storage():
    """Return a SupabaseStorage instance for use in model fields."""
    from utils.storage import SupabaseStorage
    return SupabaseStorage()


logger = logging.getLogger(__name__)


# ==================================================
# NEW STRUCTURE - Clean Hierarchy
# Product → ColorVariant → SizeVariant
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
        'Product',
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
        if self.image:
            try:
                url = self.image.url
                if isinstance(url, dict):
                    url = url.get("publicUrl") or url.get("data", {}).get("publicUrl", "")
                if url:
                    self.image_url = url
            except Exception as e:
                logger.error(f"Error getting image URL: {e}")
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


# ==================================================
# Additional Helper Fields for Product Model
# ==================================================
# Add these to the existing Product model:
#
# class Product(models.Model):
#     # ... existing fields ...
#
#     @property
#     def available_colors(self):
#         """Get all colors that have stock."""
#         return self.color_variants_new.filter(
#             is_active=True,
#             size_variants__stock_quantity__gt=0
#         ).distinct()
#
#     @property
#     def total_stock_all_variants(self):
#         """Total stock across all colors and sizes."""
#         from django.db.models import Sum
#         return ProductSizeVariant.objects.filter(
#             color_variant__product=self
#         ).aggregate(total=Sum('stock_quantity'))['total'] or 0
