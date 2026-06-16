from django.core.cache import cache
from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.utils.text import slugify

from .models import Category, Product, ProductTag, ProductColorVariant


@receiver(pre_save, sender=Category)
def auto_generate_category_slug(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.name)


@receiver(pre_save, sender=Product)
def auto_generate_product_slug(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.name)


@receiver(pre_save, sender=ProductTag)
def auto_generate_product_tag_slug(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.name)


# ==================================================
# CACHE INVALIDATION SIGNALS
# ==================================================

def invalidate_product_caches():
    """Clear all product-related cache keys"""
    cache_keys = [
        'featured_products_list',
        'new_arrivals_list',
        'bestsellers_list',
    ]
    for key in cache_keys:
        cache.delete(key)

    # Optional: Trigger Next.js revalidation (if configured)
    trigger_nextjs_revalidation()


def trigger_nextjs_revalidation():
    """
    Trigger Next.js on-demand revalidation for featured products.
    This clears Next.js cache immediately when products change.
    """
    import os
    import requests
    from django.conf import settings

    frontend_url = getattr(settings, 'FRONTEND_URL', os.getenv('FRONTEND_URL'))
    revalidate_secret = os.getenv('NEXTJS_REVALIDATE_SECRET')

    if not frontend_url or not revalidate_secret:
        # Silently skip if not configured (dev environment)
        return

    try:
        # Revalidate 'featured' cache tag
        response = requests.post(
            f"{frontend_url}/api/revalidate",
            params={'tag': 'featured', 'secret': revalidate_secret},
            timeout=5
        )
        if response.status_code == 200:
            print(f"✓ Next.js cache revalidated for 'featured' tag")
    except Exception as e:
        # Don't fail the product save if revalidation fails
        print(f"⚠ Next.js revalidation failed: {e}")


@receiver([post_save, post_delete], sender=Product)
def clear_product_cache_on_change(sender, instance, **kwargs):
    """
    Clear product caches when a product is created, updated, or deleted.
    Triggered by Django admin edits or any Product.save()/delete() call.
    """
    invalidate_product_caches()


@receiver([post_save, post_delete], sender=ProductColorVariant)
def clear_product_cache_on_color_variant_change(sender, instance, **kwargs):
    """Clear caches when color variants (with images) change"""
    invalidate_product_caches()
