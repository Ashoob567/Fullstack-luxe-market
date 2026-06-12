from decimal import Decimal
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("coupons", "0001_initial"),
        ("orders", "0001_initial"),
        ("products", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Rename min_order_amount → min_order_value ─────────────────────────
        migrations.RenameField(
            model_name="coupon",
            old_name="min_order_amount",
            new_name="min_order_value",
        ),

        # ── Add missing fields to Coupon ──────────────────────────────────────
        migrations.AddField(
            model_name="coupon",
            name="description",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Optional description shown to users.",
            ),
        ),
        migrations.AddField(
            model_name="coupon",
            name="max_discount_amount",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Cap on discount for percentage coupons (leave blank = no cap).",
                max_digits=10,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="coupon",
            name="max_uses_per_user",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Maximum times a single user can redeem this coupon (0 = unlimited).",
            ),
        ),
        # Fix default: 0 now means unlimited (was 1)
        migrations.AlterField(
            model_name="coupon",
            name="max_uses",
            field=models.PositiveIntegerField(
                default=0,
                help_text="Maximum total redemptions (0 = unlimited).",
            ),
        ),

        # ── Scope M2M fields ──────────────────────────────────────────────────
        migrations.AddField(
            model_name="coupon",
            name="applicable_categories",
            field=models.ManyToManyField(
                blank=True,
                help_text="Restrict coupon to specific categories (leave empty = all categories).",
                related_name="coupons",
                to="products.category",
            ),
        ),
        migrations.AddField(
            model_name="coupon",
            name="applicable_products",
            field=models.ManyToManyField(
                blank=True,
                help_text="Restrict coupon to specific products (leave empty = all products).",
                related_name="coupons",
                to="products.product",
            ),
        ),

        # ── Create CouponUsage model ──────────────────────────────────────────
        migrations.CreateModel(
            name="CouponUsage",
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
                    "discount_applied",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Actual discount amount deducted from this order.",
                        max_digits=10,
                    ),
                ),
                ("used_at", models.DateTimeField(auto_now_add=True)),
                (
                    "coupon",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="usages",
                        to="coupons.coupon",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="coupon_usages",
                        to="orders.order",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="coupon_usages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Coupon Usage",
                "verbose_name_plural": "Coupon Usages",
                "ordering": ["-used_at"],
            },
        ),
    ]
