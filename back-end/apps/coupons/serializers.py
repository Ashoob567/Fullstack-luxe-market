from django.utils import timezone
from rest_framework import serializers
from .models import Coupon, CouponUsage


class CouponValidateSerializer(serializers.Serializer):
    """
    Input serializer for POST /api/coupons/validate/
    Frontend sends: { "code": "SAVE20", "cart_total": 5000 }
    """
    code       = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2)


class CouponResponseSerializer(serializers.ModelSerializer):
    """
    Response shape sent back to frontend after successful validation.
    Frontend uses this to show the discount breakdown in cart/checkout.
    """
    discount_amount  = serializers.SerializerMethodField()
    final_total      = serializers.SerializerMethodField()
    validity_message = serializers.SerializerMethodField()

    class Meta:
        model  = Coupon
        fields = [
            "code",
            "description",
            "discount_type",
            "discount_value",
            "max_discount_amount",
            "min_order_value",
            "discount_amount",
            "final_total",
            "validity_message",
            "valid_until",
        ]

    def get_discount_amount(self, obj):
        cart_total = self.context.get("cart_total", 0)
        return str(obj.calculate_discount(cart_total))

    def get_final_total(self, obj):
        from decimal import Decimal
        cart_total = Decimal(str(self.context.get("cart_total", 0)))
        return str(cart_total - obj.calculate_discount(cart_total))

    def get_validity_message(self, obj):
        days_left = (obj.valid_until - timezone.now()).days
        if days_left <= 0:
            return "Expires today"
        if days_left == 1:
            return "Expires tomorrow"
        if days_left <= 7:
            return f"Expires in {days_left} days"
        return f"Valid until {obj.valid_until.strftime('%b %d, %Y')}"


class CouponUsageSerializer(serializers.ModelSerializer):
    """Used in admin — shows per-user usage history."""
    coupon_code  = serializers.CharField(source="coupon.code", read_only=True)
    user_email   = serializers.CharField(source="user.email", read_only=True)
    order_id     = serializers.UUIDField(source="order.id", read_only=True, allow_null=True)

    class Meta:
        model  = CouponUsage
        fields = ["id", "coupon_code", "user_email", "order_id", "discount_applied", "used_at"]
        read_only_fields = fields