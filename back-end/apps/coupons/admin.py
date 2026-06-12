from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Coupon, CouponUsage


class CouponUsageInline(admin.TabularInline):
    """Shows usage history inline inside each Coupon's admin detail page."""
    model          = CouponUsage
    extra          = 0
    readonly_fields = ["user", "order", "discount_applied", "used_at"]
    can_delete     = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "discount_summary",
        "usage_progress",
        "min_order_value",
        "validity_status",
        "is_active",
        "valid_from",
        "valid_until",
    ]
    list_filter   = ["discount_type", "is_active", "valid_from", "valid_until"]
    search_fields = ["code", "description"]
    readonly_fields = ["id", "used_count", "created_at", "updated_at"]
    ordering      = ["-created_at"]
    list_per_page = 30
    inlines       = [CouponUsageInline]

    fieldsets = (
        ("Basic Info", {
            "fields": ("id", "code", "description", "is_active"),
        }),
        ("Discount", {
            "fields": ("discount_type", "discount_value", "max_discount_amount", "min_order_value"),
        }),
        ("Usage Limits", {
            "fields": ("max_uses", "used_count", "max_uses_per_user"),
        }),
        ("Validity Window", {
            "fields": ("valid_from", "valid_until"),
        }),
        ("Scope (leave empty = applies to everything)", {
            "fields": ("applicable_categories", "applicable_products"),
            "classes": ("collapse",),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    # ── computed columns ──────────────────────────────────────────────────────

    @admin.display(description="Discount")
    def discount_summary(self, obj):
        if obj.discount_type == "percentage":
            cap = f" (max Rs. {obj.max_discount_amount:,.0f})" if obj.max_discount_amount else ""
            return f"{obj.discount_value}% off{cap}"
        return f"Rs. {obj.discount_value:,.0f} off"

    @admin.display(description="Usage")
    def usage_progress(self, obj):
        if obj.max_uses == 0:
            return f"{obj.used_count} / unlimited"
        pct  = int((obj.used_count / obj.max_uses) * 100)
        color = "red" if pct >= 90 else ("orange" if pct >= 60 else "green")
        return format_html(
            '<span style="color:{}">{} / {} ({}%)</span>',
            color, obj.used_count, obj.max_uses, pct,
        )

    @admin.display(description="Status")
    def validity_status(self, obj):
        now = timezone.now()
        if not obj.is_active:
            return format_html('<span style="color:gray">Inactive</span>')
        if now < obj.valid_from:
            return format_html('<span style="color:orange">Scheduled</span>')
        if now > obj.valid_until:
            return format_html('<span style="color:red">Expired</span>')
        if obj.max_uses > 0 and obj.used_count >= obj.max_uses:
            return format_html('<span style="color:red">Exhausted</span>')
        return format_html('<span style="color:green">✓ Active</span>')

    def has_delete_permission(self, request, obj=None):
        # prevent deleting coupons that have been used — preserve audit trail
        if obj and obj.used_count > 0:
            return False
        return super().has_delete_permission(request, obj)


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display  = ["coupon_code", "user_email", "order_id_short", "discount_applied", "used_at"]
    list_filter   = ["used_at", "coupon"]
    search_fields = ["coupon__code", "user__email"]
    readonly_fields = ["id", "coupon", "user", "order", "discount_applied", "used_at"]
    ordering      = ["-used_at"]
    list_per_page = 50

    @admin.display(description="Coupon", ordering="coupon__code")
    def coupon_code(self, obj):
        return obj.coupon.code

    @admin.display(description="User", ordering="user__email")
    def user_email(self, obj):
        return obj.user.email

    @admin.display(description="Order")
    def order_id_short(self, obj):
        if obj.order:
            return str(obj.order.id)[:8] + "..."
        return "—"

    def has_add_permission(self, request):
        return False  # usage records are created by the system only

    def has_change_permission(self, request, obj=None):
        return False  # usage records are immutable