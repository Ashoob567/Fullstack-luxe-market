"""
apps/users/address_serializers.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
DRF serializer for UserAddress model.
"""

from rest_framework import serializers
from .address_models import UserAddress


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            "id",
            "label",
            "first_name",
            "last_name",
            "phone",
            "street_address",
            "city",
            "province",
            "postal_code",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
