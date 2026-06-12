from decimal import Decimal
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Coupon",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "code",
                    models.CharField(db_index=True, max_length=50, unique=True),
                ),
                (
                    "discount_type",
                    models.CharField(
                        choices=[
                            ("percentage", "Percentage"),
                            ("fixed", "Fixed Amount"),
                        ],
                        default="percentage",
                        max_length=10,
                    ),
                ),
                (
                    "discount_value",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Percentage (0–100) or fixed currency amount.",
                        max_digits=10,
                    ),
                ),
                (
                    "min_order_amount",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Minimum cart total required to apply this coupon.",
                        max_digits=10,
                    ),
                ),
                (
                    "max_uses",
                    models.PositiveIntegerField(
                        default=1,
                        help_text="Maximum number of times this coupon can be redeemed.",
                    ),
                ),
                (
                    "used_count",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Running total of successful redemptions.",
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("valid_from", models.DateTimeField()),
                ("valid_until", models.DateTimeField()),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True),
                ),
            ],
            options={
                "verbose_name": "Coupon",
                "verbose_name_plural": "Coupons",
                "ordering": ["-created_at"],
            },
        ),
    ]