"""
Request/response serializers for OTP endpoints.

DRF serializers provide:
  - Automatic validation (type checking, regex, choices)
  - OpenAPI schema generation (drf-spectacular)
  - Consistent error messages
  - Eliminates manual request.data.get() checks in views
"""

import re
from rest_framework import serializers
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjValidationError


# --- Send OTP ---

class SendOTPSerializer(serializers.Serializer):
    """
    POST /api/payments/send-otp/

    Example:
        {
          "contact": "alice@example.com",
          "contact_type": "email"
        }
    """
    contact = serializers.CharField(max_length=254)
    contact_type = serializers.ChoiceField(choices=["email", "phone"])

    def validate(self, data):
        contact = data["contact"]
        contact_type = data["contact_type"]

        if contact_type == "email":
            try:
                validate_email(contact)
            except DjValidationError:
                raise serializers.ValidationError({
                    "contact": "Invalid email format."
                })

        elif contact_type == "phone":
            # Pakistani format: 03XXXXXXXXX (11 digits)
            if not re.match(r"^03[0-9]{9}$", contact):
                raise serializers.ValidationError({
                    "contact": "Phone must match format: 03XXXXXXXXX (Pakistani mobile)"
                })

        return data


# --- Verify OTP & Create Order ---

class ShippingAddressSerializer(serializers.Serializer):
    """Nested serializer for shipping address validation."""
    firstName = serializers.CharField(max_length=100)
    lastName = serializers.CharField(max_length=100)
    phone = serializers.RegexField(
        r"^03[0-9]{9}$",
        error_messages={"invalid": "Phone must be 03XXXXXXXXX"},
    )
    streetAddress = serializers.CharField(max_length=500)
    city = serializers.CharField(max_length=100)
    province = serializers.CharField(max_length=100)
    postalCode = serializers.CharField(max_length=10)
    email = serializers.EmailField(required=False, allow_blank=True)


class CartItemSerializer(serializers.Serializer):
    """Cart item for fallback (guest checkout with expired Redis cart)."""
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    product_name = serializers.CharField(max_length=255)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField(min_value=1)
    variant_info = serializers.JSONField(required=False, default=dict)


class OrderDataSerializer(serializers.Serializer):
    """Nested serializer for order_data payload."""
    shipping_address = ShippingAddressSerializer()
    payment_method = serializers.ChoiceField(choices=["cod", "mock_card"])
    card_number = serializers.CharField(required=False, allow_blank=True)
    is_discreet = serializers.BooleanField(default=False)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    cart_id = serializers.CharField(required=False, allow_blank=True)
    cart_items = serializers.ListField(
        child=CartItemSerializer(),
        required=False,
        allow_empty=True,
    )


class VerifyOTPAndOrderSerializer(serializers.Serializer):
    """
    POST /api/payments/verify-and-create-order/

    Example:
        {
          "contact": "03001234567",
          "contact_type": "phone",
          "otp": "123456",
          "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
          "order_data": {
            "shipping_address": {...},
            "payment_method": "cod",
            "is_discreet": false
          }
        }
    """
    contact = serializers.CharField(max_length=254)
    contact_type = serializers.ChoiceField(choices=["email", "phone"])
    otp = serializers.RegexField(
        r"^\d{6}$",
        error_messages={"invalid": "OTP must be exactly 6 digits."},
    )
    idempotency_key = serializers.UUIDField()
    order_data = OrderDataSerializer()

    def validate_order_data(self, value):
        """Additional cross-field validation for order_data."""
        payment_method = value.get("payment_method")
        card_number = value.get("card_number", "").replace(" ", "").replace("-", "")

        # Card number required for card payments
        if payment_method == "mock_card" and len(card_number) < 12:
            raise serializers.ValidationError(
                "card_number is required and must be at least 12 digits for card payments."
            )

        return value
