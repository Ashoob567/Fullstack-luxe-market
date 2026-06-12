"""
apps/users/address_models.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Saved shipping addresses for authenticated users.

Fields mirror the ShippingAddress JSON snapshot used in orders:
  firstName, lastName, phone, streetAddress, city, province, postalCode
Plus: label (e.g. "Home"), is_default.
"""

import uuid
from django.db import models
from django.conf import settings


class UserAddress(models.Model):

    PROVINCE_CHOICES = [
        ("Punjab",      "Punjab"),
        ("Sindh",       "Sindh"),
        ("KPK",         "KPK"),
        ("Balochistan", "Balochistan"),
        ("Islamabad",   "Islamabad"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )

    label       = models.CharField(max_length=50, blank=True, default="Home",
                                   help_text='e.g. "Home", "Office"')
    first_name  = models.CharField(max_length=100)
    last_name   = models.CharField(max_length=100)
    phone       = models.CharField(max_length=20)
    street_address = models.CharField(max_length=255)
    city        = models.CharField(max_length=100)
    province    = models.CharField(max_length=20, choices=PROVINCE_CHOICES)
    postal_code = models.CharField(max_length=20)
    is_default  = models.BooleanField(default=False)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        verbose_name = "User Address"
        verbose_name_plural = "User Addresses"

    def __str__(self):
        return f"{self.label} — {self.first_name} {self.last_name}, {self.city}"

    def save(self, *args, **kwargs):
        # Ensure only one default address per user
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).exclude(
                pk=self.pk
            ).update(is_default=False)
        super().save(*args, **kwargs)

    def to_shipping_dict(self) -> dict:
        """Return a dict matching the ShippingAddress JSON shape used in orders."""
        return {
            "firstName":     self.first_name,
            "lastName":      self.last_name,
            "phone":         self.phone,
            "streetAddress": self.street_address,
            "city":          self.city,
            "province":      self.province,
            "postalCode":    self.postal_code,
        }
