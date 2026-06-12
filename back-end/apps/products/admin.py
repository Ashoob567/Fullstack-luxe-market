from django.contrib import admin
import nested_admin

from .models import (
    Category, Product, ProductTag, Review,
    ProductVariantV2,
    ProductColorVariant, ProductSizeVariant
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "is_active", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    list_filter = ("is_active", "parent")
    search_fields = ("name",)


# ==================================================
# UNIFIED VARIANT ADMIN - Single Page Product Entry ✨
# (Denormalized - kept for backward compatibility)
# ==================================================

class ProductVariantV2Inline(nested_admin.NestedTabularInline):
    """
    Inline for unified variants - add color + size + image all in one table!
    NOTE: This is the DENORMALIZED approach (image duplicated per size)
    For normalized structure, use ProductColorVariantInline below
    """
    model = ProductVariantV2
    extra = 3
    fields = (
        'color_name',
        'hex_primary',
        'image',
        'size_name',
        'sku',
        'stock_quantity',
        'price_adjustment',
        'is_active',
        'display_order'
    )
    ordering = ('display_order', 'color_name', 'size_name')


@admin.register(ProductTag)
class ProductTagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("product__name", "user__email", "comment")
    readonly_fields = ("created_at", "updated_at")


# ==================================================
# UNIFIED VARIANT STANDALONE ADMIN (for bulk editing)
# ==================================================

@admin.register(ProductVariantV2)
class ProductVariantV2Admin(admin.ModelAdmin):
    """
    Standalone admin for bulk editing variants or viewing all SKUs.
    Most of the time you'll add variants via Product admin inline.
    """
    list_display = (
        'get_product_name',
        'color_name',
        'size_name',
        'sku',
        'stock_quantity',
        'price_adjustment',
        'is_active',
        'get_stock_status'
    )
    list_filter = (
        'is_active',
        'product__category',
        'color_name',
        'size_name'
    )
    search_fields = ('sku', 'color_name', 'size_name', 'product__name')
    list_editable = ('stock_quantity', 'is_active')
    readonly_fields = ('image_url', 'created_at', 'updated_at', 'get_stock_status', 'get_final_price')

    fieldsets = (
        ('Product', {
            'fields': ('product',)
        }),
        ('Color Information', {
            'fields': ('color_name', 'hex_primary', 'hex_light', 'hex_dark')
        }),
        ('Image', {
            'fields': ('image', 'image_url'),
            'description': 'Upload image. URL will be auto-generated.'
        }),
        ('Size & Inventory', {
            'fields': ('size_name', 'sku', 'stock_quantity', 'price_adjustment', 'get_final_price')
        }),
        ('Settings', {
            'fields': ('is_active', 'display_order')
        }),
        ('Status', {
            'fields': ('get_stock_status',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_product_name(self, obj):
        return obj.product.name
    get_product_name.short_description = 'Product'
    get_product_name.admin_order_field = 'product__name'

    def get_stock_status(self, obj):
        return '✓ In Stock' if obj.is_in_stock else '✗ Out of Stock'
    get_stock_status.short_description = 'Stock Status'

    def get_final_price(self, obj):
        return f"Rs. {obj.final_price}"
    get_final_price.short_description = 'Final Price'


# ==================================================
# NORMALIZED STRUCTURE ADMIN (RECOMMENDED!) ✨
# Product → Color (with image) → Sizes
# Proper 3NF normalization!
# ==================================================

class ProductSizeVariantInline(nested_admin.NestedTabularInline):
    """Inline for sizes within a color variant - NESTED INLINE!"""
    model = ProductSizeVariant
    extra = 3
    fields = ('size_name', 'sku', 'stock_quantity', 'price_adjustment', 'is_active', 'display_order')
    ordering = ('display_order', 'size_name')


class ProductColorVariantInline(nested_admin.NestedStackedInline):
    """
    Inline for color variants with NESTED size inline.

    This allows adding colors WITH their sizes directly in Product admin!
    ✅ Proper normalization: Image stored once per color
    ✅ Great UX: Add everything on one page
    """
    model = ProductColorVariant
    extra = 1
    inlines = [ProductSizeVariantInline]  # NESTED INLINE!
    fields = (
        'color_name',
        'hex_primary',
        'hex_light',
        'hex_dark',
        'image',
        'is_active',
        'display_order'
    )
    ordering = ('display_order', 'color_name')


@admin.register(Product)
class ProductAdmin(nested_admin.NestedModelAdmin):
    """
    Product admin with NESTED inline support!

    Add product → Add colors → Add sizes for each color
    ALL ON ONE PAGE! ✨

    Hierarchy:
    Product
      └── Colors (inline)
            └── Sizes (nested inline)
    """
    inlines = [ProductColorVariantInline, ProductVariantV2Inline]
    list_display = (
        "name",
        "category",
        "base_price",
        "sale_price",
        "is_featured",
        "is_active",
        "get_color_count",
        "get_total_stock",
        "created_at",
    )
    list_filter = ("category", "is_featured", "is_active")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("is_featured", "is_active")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at", "get_color_count", "get_total_stock")

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'category')
        }),
        ('Pricing', {
            'fields': ('base_price', 'sale_price')
        }),
        ('Flash Sale', {
            'fields': ('is_flash_sale', 'flash_sale_price', 'flash_sale_ends_at'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_featured', 'is_active', 'tags')
        }),
        ('Stock Summary', {
            'fields': ('get_color_count', 'get_total_stock'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_color_count(self, obj):
        """Count of active color variants."""
        return obj.color_variants_new.filter(is_active=True).count()
    get_color_count.short_description = 'Colors'

    def get_total_stock(self, obj):
        """Total stock across all color variants."""
        from django.db.models import Sum
        total = 0
        for color in obj.color_variants_new.all():
            color_stock = color.size_variants.aggregate(total=Sum('stock_quantity'))['total'] or 0
            total += color_stock
        return total
    get_total_stock.short_description = 'Total Stock'


@admin.register(ProductColorVariant)
class ProductColorVariantAdmin(admin.ModelAdmin):
    """
    Admin for managing color variants with nested size editing.
    Use this to add sizes after creating the color variant.
    """
    inlines = [ProductSizeVariantInline]
    list_display = (
        'product',
        'color_name',
        'hex_primary',
        'is_active',
        'get_total_stock',
        'display_order',
        'created_at'
    )
    list_filter = ('is_active', 'product__category', 'product')
    search_fields = ('product__name', 'color_name', 'hex_primary')
    list_editable = ('is_active', 'display_order')
    readonly_fields = ('image_url', 'created_at', 'updated_at', 'get_total_stock', 'get_is_in_stock')

    fieldsets = (
        ('Product', {
            'fields': ('product',)
        }),
        ('Color Information', {
            'fields': ('color_name', 'hex_primary', 'hex_light', 'hex_dark')
        }),
        ('Image', {
            'fields': ('image', 'image_url'),
            'description': 'Upload image for this color variant. URL will be auto-generated.'
        }),
        ('Settings', {
            'fields': ('is_active', 'display_order')
        }),
        ('Stock Summary (Auto-calculated)', {
            'fields': ('get_total_stock', 'get_is_in_stock'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_total_stock(self, obj):
        return obj.total_stock
    get_total_stock.short_description = 'Total Stock'

    def get_is_in_stock(self, obj):
        return '✓ In Stock' if obj.is_in_stock else '✗ Out of Stock'
    get_is_in_stock.short_description = 'Stock Status'


@admin.register(ProductSizeVariant)
class ProductSizeVariantAdmin(admin.ModelAdmin):
    """
    Admin for managing individual size variants.
    Use for bulk updates or viewing specific SKUs.
    """
    list_display = (
        'get_product_name',
        'get_color_name',
        'size_name',
        'sku',
        'stock_quantity',
        'price_adjustment',
        'is_active',
        'get_stock_status'
    )
    list_filter = (
        'is_active',
        'color_variant__product__category',
        'color_variant__product',
        'color_variant__color_name'
    )
    search_fields = ('sku', 'size_name', 'color_variant__color_name', 'color_variant__product__name')
    list_editable = ('stock_quantity', 'is_active')
    readonly_fields = ('created_at', 'updated_at', 'get_stock_status', 'get_final_price')

    fieldsets = (
        ('Variant Details', {
            'fields': ('color_variant', 'size_name', 'sku')
        }),
        ('Inventory & Pricing', {
            'fields': ('stock_quantity', 'price_adjustment', 'get_final_price')
        }),
        ('Settings', {
            'fields': ('is_active', 'display_order')
        }),
        ('Computed Values', {
            'fields': ('get_stock_status',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_product_name(self, obj):
        return obj.color_variant.product.name
    get_product_name.short_description = 'Product'
    get_product_name.admin_order_field = 'color_variant__product__name'

    def get_color_name(self, obj):
        return obj.color_variant.color_name
    get_color_name.short_description = 'Color'
    get_color_name.admin_order_field = 'color_variant__color_name'

    def get_stock_status(self, obj):
        return '✓ In Stock' if obj.is_in_stock else '✗ Out of Stock'
    get_stock_status.short_description = 'Stock Status'

    def get_final_price(self, obj):
        return f"Rs. {obj.final_price}"
    get_final_price.short_description = 'Final Price'
