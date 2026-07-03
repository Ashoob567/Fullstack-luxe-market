import uuid
from django.db import models
from django.conf import settings


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        SHIPPED   = 'shipped',   'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        MOCK_CARD = 'mock_card', 'Card (Test Mode)'
        COD       = 'cod',       'Cash on Delivery'

    class PaymentStatus(models.TextChoices):
        PENDING  = 'pending',  'Pending'
        PAID     = 'paid',     'Paid'
        FAILED   = 'failed',   'Failed'
        REFUNDED = 'refunded', 'Refunded'

    # ── Identity ──────────────────────────────────────────────────────────────
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.UUIDField(
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Unique key to prevent duplicate orders (OTP verification flow)",
    )

    # ── Customer ──────────────────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='orders',
    )
    guest_email = models.EmailField(null=True, blank=True)

    # ── Status ────────────────────────────────────────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    # ── Payment ───────────────────────────────────────────────────────────────
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    mock_payment_id = models.CharField(
        max_length=100,
        null=True, blank=True,
        help_text="Mock payment ID (for testing).",
    )

    # ── Financials (stored in PKR) ────────────────────────────────────────────
    subtotal        = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=200)
    total_amount    = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code     = models.CharField(max_length=50, null=True, blank=True)

    # ── Shipping ──────────────────────────────────────────────────────────────
    # Snapshot: store a copy of the address so historical orders stay accurate
    # even if the user later changes their address.
    # Expected keys: firstName, lastName, phone, streetAddress,
    #                city, province, postalCode
    shipping_address = models.JSONField()

    # ── Extras ────────────────────────────────────────────────────────────────
    is_discreet = models.BooleanField(
        default=False,
        help_text="Ship in a plain box with no branding.",
    )
    notes = models.TextField(null=True, blank=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        customer = self.user.email if self.user else (self.guest_email or 'Guest')
        return f"Order {str(self.id)[:8].upper()} — {customer} — {self.get_status_display()}"

    # ── Convenience helpers ───────────────────────────────────────────────────
    @property
    def order_number(self):
        """Short, human-readable order reference, e.g. LM-A1B2C3D4."""
        return f"LM-{str(self.id)[:8].upper()}"

    @property
    def is_cancellable(self):
        return self.status in (self.Status.PENDING, self.Status.CONFIRMED)

    @property
    def display_amount(self):
        return f"PKR {self.total_amount:,.0f}"


class OrderItem(models.Model):

    # ── Identity ──────────────────────────────────────────────────────────────
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Relations ─────────────────────────────────────────────────────────────
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
    )
    # Keep a loose FK to the live product/variant, but don't let a product
    # deletion destroy order history (SET_NULL + snapshots below).
    product = models.ForeignKey(
        'products.Product',          # adjust to your actual app label
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='order_items',
    )
    variant = models.ForeignKey(
        'products.ProductSizeVariant',   # Updated to new normalized structure
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='order_items',
    )

    # ── Snapshots (source of truth for this order line) ───────────────────────
    product_name_snapshot = models.CharField(max_length=255)
    # Example: {"size": "L", "color": "Black", "sku": "ABC-L-BLK"}
    variant_info_snapshot = models.JSONField(default=dict)

    # ── Pricing ───────────────────────────────────────────────────────────────
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity   = models.PositiveIntegerField()
    subtotal   = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.product_name_snapshot} × {self.quantity} (Order {self.order.order_number})"

    def save(self, *args, **kwargs):
        # Auto-calculate subtotal before saving so callers don't have to.
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)