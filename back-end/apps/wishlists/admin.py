from django.contrib import admin
from .models import Wishlist


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display  = ["user_email", "product_name", "product_category", "created_at"]
    list_filter   = ["created_at", "product__category"]
    search_fields = ["user__email", "product__name", "product__slug"]
    readonly_fields = ["id", "user", "product", "created_at"]
    ordering      = ["-created_at"]
    list_per_page = 50

    # ── computed columns ──────────────────────────────────────────────────────

    @admin.display(description="User", ordering="user__email")
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description="Product", ordering="product__name")
    def product_name(self, obj):
        return obj.product.name

    @admin.display(description="Category", ordering="product__category__name")
    def product_category(self, obj):
        return obj.product.category.name if obj.product.category else "—"

    # ── permissions ───────────────────────────────────────────────────────────

    def has_add_permission(self, request):
        # wishlist items are created by users through the API only
        return False

    def has_change_permission(self, request, obj=None):
        # wishlist items should not be editable from admin
        return False
