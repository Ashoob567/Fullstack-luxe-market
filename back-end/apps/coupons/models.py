from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ("percentage", "Percentage"),
        ("fixed", "Fixed Amount"),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(
        blank=True,
        default="",
        help_text="Optional description shown to users.",
    )
    discount_type = models.CharField(
        max_length=10,
        choices=DISCOUNT_TYPE_CHOICES,
        default="percentage",
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage (0–100) or fixed currency amount.",
    )
    max_discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cap on discount for percentage coupons (leave blank = no cap).",
    )
    min_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Minimum cart total required to apply this coupon.",
    )
    max_uses = models.PositiveIntegerField(
        default=0,
        help_text="Maximum total redemptions (0 = unlimited).",
    )
    used_count = models.PositiveIntegerField(
        default=0,
        help_text="Running total of successful redemptions.",
    )
    max_uses_per_user = models.PositiveIntegerField(
        default=0,
        help_text="Maximum times a single user can redeem this coupon (0 = unlimited).",
    )
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    # Optional scope restrictions (empty = applies to everything)
    applicable_categories = models.ManyToManyField(
        "products.Category",
        blank=True,
        related_name="coupons",
        help_text="Restrict coupon to specific categories (leave empty = all categories).",
    )
    applicable_products = models.ManyToManyField(
        "products.Product",
        blank=True,
        related_name="coupons",
        help_text="Restrict coupon to specific products (leave empty = all products).",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"

    def __str__(self) -> str:
        label = (
            f"{self.discount_value}%"
            if self.discount_type == "percentage"
            else f"Rs.{self.discount_value} off"
        )
        return f"{self.code} — {label}"

    # ------------------------------------------------------------------
    # Business logic
    # ------------------------------------------------------------------

    def is_valid(self) -> bool:
        """Return True only when every validity condition is satisfied."""
        now = timezone.now()
        if not self.is_active:
            return False
        if not (self.valid_from <= now <= self.valid_until):
            return False
        # max_uses == 0 means unlimited
        if self.max_uses > 0 and self.used_count >= self.max_uses:
            return False
        return True

    def calculate_discount(self, cart_total: Decimal) -> Decimal:
        """
        Return the discount amount to subtract from *cart_total*.

        • percentage → cart_total × (discount_value / 100), optionally capped
                        by max_discount_amount
        • fixed      → min(discount_value, cart_total)   [never exceed total]
        """
        cart_total = Decimal(str(cart_total))

        if self.discount_type == "percentage":
            discount = (cart_total * (self.discount_value / Decimal("100"))).quantize(
                Decimal("0.01")
            )
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return discount

        # fixed
        return min(self.discount_value, cart_total)


class CouponUsage(models.Model):
    """
    Immutable audit record created each time a coupon is successfully redeemed.
    One row per order that used a coupon.
    """
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.PROTECT,
        related_name="usages",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="coupon_usages",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coupon_usages",
    )
    discount_applied = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Actual discount amount deducted from this order.",
    )
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-used_at"]
        verbose_name = "Coupon Usage"
        verbose_name_plural = "Coupon Usages"

    def __str__(self) -> str:
        return f"{self.coupon.code} — {self.user} @ {self.used_at:%Y-%m-%d}"
