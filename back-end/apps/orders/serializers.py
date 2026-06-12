"""
apps/orders/serializers.py

DRF serializers for Order and OrderItem models.

Serializers
───────────────────────────────────────────────────
OrderItemSerializer     — read-only line-item representation
OrderSerializer         — full order representation (items nested)
OrderListSerializer     — lightweight order representation (no items)
GuestOrderTrackSerializer — limited public view for unauthenticated tracking
"""

from rest_framework import serializers

from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Read-only serializer for a single order line item."""

    id         = serializers.UUIDField(read_only=True)
    product_id = serializers.UUIDField(source="product_id", read_only=True)
    variant_id = serializers.UUIDField(source="variant_id", read_only=True)
    name       = serializers.CharField(source="product_name_snapshot", read_only=True)
    variant    = serializers.JSONField(source="variant_info_snapshot", read_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    quantity   = serializers.IntegerField(read_only=True)
    subtotal   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = [
            "id",
            "product_id",
            "variant_id",
            "name",
            "variant",
            "unit_price",
            "quantity",
            "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    """
    Full order serializer — includes nested items and computed properties.

    Used by OrderDetailView.
    """

    id                      = serializers.UUIDField(read_only=True)
    order_number            = serializers.CharField(read_only=True)
    status_display          = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display  = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display  = serializers.CharField(source="get_payment_status_display", read_only=True)
    subtotal                = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_amount         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shipping_amount         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_amount            = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_cancellable          = serializers.BooleanField(read_only=True)
    display_amount          = serializers.CharField(read_only=True)
    created_at              = serializers.DateTimeField(read_only=True)
    updated_at              = serializers.DateTimeField(read_only=True)
    items                   = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "subtotal",
            "discount_amount",
            "shipping_amount",
            "total_amount",
            "coupon_code",
            "shipping_address",
            "is_discreet",
            "notes",
            "created_at",
            "updated_at",
            "is_cancellable",
            "display_amount",
            "items",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    """
    Lightweight order serializer — omits items for list views.

    Used by UserOrderListView.
    """

    id                      = serializers.UUIDField(read_only=True)
    order_number            = serializers.CharField(read_only=True)
    status_display          = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display  = serializers.CharField(source="get_payment_method_display", read_only=True)
    payment_status_display  = serializers.CharField(source="get_payment_status_display", read_only=True)
    subtotal                = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_amount         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shipping_amount         = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_amount            = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_cancellable          = serializers.BooleanField(read_only=True)
    display_amount          = serializers.CharField(read_only=True)
    created_at              = serializers.DateTimeField(read_only=True)
    updated_at              = serializers.DateTimeField(read_only=True)

    class Meta:
        model  = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_display",
            "payment_method",
            "payment_method_display",
            "payment_status",
            "payment_status_display",
            "subtotal",
            "discount_amount",
            "shipping_amount",
            "total_amount",
            "coupon_code",
            "shipping_address",
            "is_discreet",
            "notes",
            "created_at",
            "updated_at",
            "is_cancellable",
            "display_amount",
        ]


class GuestOrderTrackSerializer(serializers.ModelSerializer):
    """
    Limited public serializer for unauthenticated order tracking.

    Exposes only safe, non-sensitive fields — no full address, no internal IDs.
    """

    order_number            = serializers.CharField(read_only=True)
    status_display          = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display  = serializers.CharField(source="get_payment_method_display", read_only=True)
    total_amount            = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    currency                = serializers.SerializerMethodField()
    created_at              = serializers.DateTimeField(read_only=True)
    shipping_city           = serializers.SerializerMethodField()
    shipping_province       = serializers.SerializerMethodField()
    item_count              = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            "order_number",
            "status",
            "status_display",
            "payment_method_display",
            "payment_status",
            "total_amount",
            "currency",
            "created_at",
            "shipping_city",
            "shipping_province",
            "item_count",
        ]

    def get_currency(self, obj: Order) -> str:
        return "PKR"

    def get_shipping_city(self, obj: Order) -> str:
        return obj.shipping_address.get("city", "")

    def get_shipping_province(self, obj: Order) -> str:
        return obj.shipping_address.get("province", "")

    def get_item_count(self, obj: Order) -> int:
        return obj.items.count()
