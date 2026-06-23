"""
apps/products/tasks.py

Django Q async tasks for product management.
"""
import logging
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction

from apps.products.models import Product, ProductSizeVariant

logger = logging.getLogger(__name__)


# ============================================================================
# USE CASE 1: EXPIRE FLASH SALES
# ============================================================================

def expire_flash_sales():
    """
    Automatically expire flash sales that have ended.

    Triggered: Scheduled task (runs every 5 minutes)
    Frequency: 288 times per day (every 5 minutes)
    Priority: HIGH - Affects product pricing

    Returns:
        str: Number of expired flash sales
    """
    try:
        # Find products with expired flash sales
        expired_products = Product.objects.filter(
            is_flash_sale=True,
            flash_sale_ends_at__lte=timezone.now()
        )

        count = expired_products.count()

        if count == 0:
            logger.info("✅ No flash sales to expire")
            return "No flash sales to expire"

        # Update products
        expired_products.update(is_flash_sale=False)

        # Clear product cache (so frontend sees updated prices)
        cache_keys = [
            'products:list:*',
            'products:featured:*',
            'products:flash_sale:*',
        ]
        for key_pattern in cache_keys:
            cache.delete_pattern(key_pattern)

        logger.info(f"✅ Expired {count} flash sales")

        # Log which products were affected
        for product in expired_products[:10]:  # Log first 10
            logger.info(
                f"   - {product.name}: "
                f"PKR {product.flash_sale_price} → PKR {product.computed_price}"
            )

        return f"Expired {count} flash sales"

    except Exception as exc:
        logger.exception(f"❌ Error expiring flash sales: {exc}")
        raise


# ============================================================================
# USE CASE 2: REDUCE PRODUCT STOCK (ASYNC)
# ============================================================================

def reduce_product_stock(variant_id, quantity):
    """
    Reduce stock quantity after successful checkout.

    Triggered: After payment confirmation
    Frequency: Once per order item
    Priority: HIGH - Inventory accuracy

    Args:
        variant_id (str): UUID of ProductSizeVariant
        quantity (int): Quantity to deduct

    Returns:
        str: Result message
    """
    try:
        with transaction.atomic():
            # Lock the row to prevent race conditions
            variant = ProductSizeVariant.objects.select_for_update().get(pk=variant_id)

            old_stock = variant.stock_quantity
            variant.stock_quantity = max(0, variant.stock_quantity - quantity)
            variant.save(update_fields=['stock_quantity'])

            logger.info(
                f"✅ Stock reduced: {variant.sku} "
                f"({old_stock} → {variant.stock_quantity})"
            )

            # Trigger low stock alert if needed
            if variant.stock_quantity < 5 and old_stock >= 5:
                from django_q.tasks import async_task
                from apps.orders.tasks import send_low_stock_alert
                async_task(
                    'apps.orders.tasks.send_low_stock_alert',
                    str(variant.id)
                )

            return f"Stock reduced: {variant.sku} ({old_stock} → {variant.stock_quantity})"

    except ProductSizeVariant.DoesNotExist:
        logger.warning(f"⚠️ Variant {variant_id} not found for stock reduction")
        return f"Variant {variant_id} not found"
    except Exception as exc:
        logger.exception(f"❌ Error reducing stock for {variant_id}: {exc}")
        raise


# ============================================================================
# USE CASE 3: OPTIMIZE PRODUCT IMAGE (ASYNC)
# ============================================================================

def optimize_product_image(color_variant_id):
    """
    Generate optimized image versions (WebP, thumbnails).

    Triggered: After admin uploads new product image
    Frequency: Once per image upload
    Priority: MEDIUM - Performance optimization

    Args:
        color_variant_id (str): UUID of ProductColorVariant

    Returns:
        str: Optimization result
    """
    try:
        from apps.products.models import ProductColorVariant
        from PIL import Image
        import io
        import requests

        variant = ProductColorVariant.objects.get(id=color_variant_id)

        if not variant.image_url:
            logger.warning(f"⚠️ No image URL for variant {color_variant_id}")
            return "No image to optimize"

        # Download original image
        response = requests.get(variant.image_url, timeout=30)
        response.raise_for_status()

        img = Image.open(io.BytesIO(response.content))

        # Define sizes
        sizes = {
            'thumb': (300, 300),
            'medium': (600, 600),
            'large': (1200, 1200),
        }

        optimized_count = 0

        for size_name, dimensions in sizes.items():
            # Create thumbnail
            optimized = img.copy()
            optimized.thumbnail(dimensions, Image.Resampling.LANCZOS)

            # Convert to WebP (60% smaller than JPEG)
            buffer = io.BytesIO()
            optimized.save(buffer, format='WEBP', quality=85, method=6)
            buffer.seek(0)

            # In production: Upload to Supabase Storage
            # upload_url = upload_to_supabase(
            #     f"products/optimized/{variant.id}_{size_name}.webp",
            #     buffer.getvalue()
            # )

            optimized_count += 1

            logger.info(
                f"✅ Optimized image: {variant.product.name} "
                f"({variant.color_name}) - {size_name}"
            )

        return f"Generated {optimized_count} optimized versions"

    except Exception as exc:
        logger.exception(f"❌ Error optimizing image for {color_variant_id}: {exc}")
        # Don't raise - image optimization failures shouldn't break the app
        return f"Failed to optimize image: {str(exc)}"


# ============================================================================
# USE CASE 4: SYNC PRODUCT STOCK FROM EXTERNAL SOURCE
# ============================================================================

def sync_product_stock_from_csv(csv_file_path):
    """
    Bulk update product stock from CSV file.

    Triggered: Manual admin action or scheduled import
    Frequency: As needed (e.g., daily warehouse sync)
    Priority: LOW - Batch operation

    Args:
        csv_file_path (str): Path to CSV file with columns: sku, stock_quantity

    Returns:
        str: Sync summary
    """
    import csv

    try:
        updated_count = 0
        not_found_count = 0

        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                sku = row.get('sku')
                new_stock = int(row.get('stock_quantity', 0))

                try:
                    variant = ProductSizeVariant.objects.get(sku=sku)
                    old_stock = variant.stock_quantity
                    variant.stock_quantity = new_stock
                    variant.save(update_fields=['stock_quantity'])

                    updated_count += 1

                    if updated_count <= 10:  # Log first 10
                        logger.info(
                            f"✅ Stock synced: {sku} "
                            f"({old_stock} → {new_stock})"
                        )

                except ProductSizeVariant.DoesNotExist:
                    not_found_count += 1
                    logger.warning(f"⚠️ SKU not found: {sku}")

        logger.info(
            f"✅ Stock sync complete: {updated_count} updated, "
            f"{not_found_count} not found"
        )

        return f"Synced {updated_count} products ({not_found_count} not found)"

    except Exception as exc:
        logger.exception(f"❌ Error syncing stock from CSV: {exc}")
        raise
