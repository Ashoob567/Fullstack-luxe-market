"""
apps/orders/admin.py

Django Admin configuration for Order and OrderItem models.

Features:
  - Full order list with filters, search, and inline status editing
  - Inline OrderItems displayed within each Order
  - Colour-coded status badges in list view
  - Read-only financial snapshot fields to prevent accidental edits
  - Direct link to related user in order detail
"""

from django.contrib import admin
from django.utils.html import format_html

from apps.orders.models import Order, OrderItem


# ── Inline ─────────────────────────────────────────────────────────────────

class OrderItemInline(admin.TabularInline):
    model  = OrderItem
    extra  = 0                          # no blank rows
    fields = (
        "product_name_snapshot",
        "variant_info_snapshot",
        "unit_price",
        "quantity",
        "subtotal",
        "product",
        "variant",
    )
    readonly_fields = (
        "product_name_snapshot",
        "variant_info_snapshot",
        "unit_price",
        "quantity",
        "subtotal",
        "product",
        "variant",
    )
    can_delete = False                  # protect historical data

    def has_add_permission(self, request, obj=None):
        return False


# ── Helpers ────────────────────────────────────────────────────────────────

# Colour map for order statuses
_STATUS_COLOURS = {
    Order.Status.PENDING:   ("#b45309", "#fef3c7"),   # amber
    Order.Status.CONFIRMED: ("#1d4ed8", "#dbeafe"),   # blue
    Order.Status.SHIPPED:   ("#7e22ce", "#f3e8ff"),   # purple
    Order.Status.DELIVERED: ("#15803d", "#dcfce7"),   # green
    Order.Status.CANCELLED: ("#9f1239", "#ffe4e6"),   # red
}

_PAYMENT_STATUS_COLOURS = {
    Order.PaymentStatus.PENDING:  ("#92400e", "#fef3c7"),
    Order.PaymentStatus.PAID:     ("#15803d", "#dcfce7"),
    Order.PaymentStatus.FAILED:   ("#9f1239", "#ffe4e6"),
    Order.PaymentStatus.REFUNDED: ("#1d4ed8", "#dbeafe"),
}


def _badge(text: str, fg: str, bg: str) -> str:
    return format_html(
        '<span style="'
        "color:{fg};background:{bg};padding:2px 8px;"
        "border-radius:9999px;font-size:11px;font-weight:600;"
        '">{text}</span>',
        fg=fg, bg=bg, text=text,
    )


# ── OrderAdmin ─────────────────────────────────────────────────────────────

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    # ── List view ──────────────────────────────────────────────────────────
    list_display = (
        "order_number",
        "coloured_status",
        "status",                         # raw field required by list_editable
        "coloured_payment_status",
        "payment_method",
        "display_amount",
        "user_email",
        "item_count",
        "created_at",
    )
    list_filter  = ("status", "payment_method", "payment_status", "is_discreet")
    list_editable = ("status",)           # quick status change from list
    search_fields = (
        "id",
        "user__email",
        "guest_email",
        "mock_payment_id",
        "coupon_code",
        "shipping_address__city",
    )
    ordering      = ("-created_at",)
    date_hierarchy = "created_at"
    list_per_page  = 25

    # ── Detail view ────────────────────────────────────────────────────────
    readonly_fields = (
        "id",
        "order_number",
        "subtotal",
        "discount_amount",
        "shipping_amount",
        "total_amount",
        "shipping_address",
        "created_at",
        "updated_at",
        "display_amount",
    )

    fieldsets = (
        ("Identity", {
            "fields": ("id", "order_number"),
        }),
        ("Customer", {
            "fields": ("user", "guest_email"),
        }),
        ("Status", {
            "fields": ("status", "payment_method", "payment_status"),
        }),
        ("Payment", {
            "fields": ("mock_payment_id",),
            "classes": ("collapse",),
        }),
        ("Financials (PKR)", {
            "fields": (
                "subtotal",
                "discount_amount",
                "shipping_amount",
                "total_amount",
                "coupon_code",
            ),
        }),
        ("Shipping", {
            "fields": ("shipping_address", "is_discreet", "notes"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    inlines = [OrderItemInline]

    # ── Custom list columns ────────────────────────────────────────────────

    @admin.display(description="Status", ordering="status")
    def coloured_status(self, obj: Order):
        fg, bg = _STATUS_COLOURS.get(obj.status, ("#374151", "#f3f4f6"))
        return _badge(obj.get_status_display(), fg, bg)

    @admin.display(description="Payment", ordering="payment_status")
    def coloured_payment_status(self, obj: Order):
        fg, bg = _PAYMENT_STATUS_COLOURS.get(obj.payment_status, ("#374151", "#f3f4f6"))
        return _badge(obj.get_payment_status_display(), fg, bg)

    @admin.display(description="Customer", ordering="user__email")
    def user_email(self, obj: Order) -> str:
        if obj.user:
            return obj.user.email
        return obj.guest_email or "—"

    @admin.display(description="Items")
    def item_count(self, obj: Order) -> int:
        return obj.items.count()

    # ── Optimise queries ───────────────────────────────────────────────────

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("user")
            .prefetch_related("items")
        )


# ── OrderItemAdmin (standalone, for direct search) ─────────────────────────

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):

    list_display  = (
        "product_name_snapshot",
        "order_number_link",
        "unit_price",
        "quantity",
        "subtotal",
    )
    search_fields = (
        "product_name_snapshot",
        "order__id",
        "order__user__email",
    )
    readonly_fields = (
        "id",
        "order",
        "product",
        "variant",
        "product_name_snapshot",
        "variant_info_snapshot",
        "unit_price",
        "quantity",
        "subtotal",
    )
    list_per_page = 50

    @admin.display(description="Order")
    def order_number_link(self, obj: OrderItem):
        return format_html(
            '<a href="/admin/orders/order/{}/change/">{}</a>',
            obj.order.id,
            obj.order.order_number,
        )

    def has_add_permission(self, request):
        return False        # items are created programmatically only

    def has_delete_permission(self, request, obj=None):
        return False        # protect historical records

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("order", "order__user")