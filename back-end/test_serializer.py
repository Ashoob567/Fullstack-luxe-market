"""
Quick test script to check if serializer works
Run: python test_serializer.py
"""
import os
import sys
import django

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.products.models import Product
from apps.products.serializers import ProductListSerializerNew

print("Testing ProductListSerializerNew...")

try:
    # Get first product
    product = Product.objects.filter(is_active=True).select_related('category').prefetch_related('tags', 'color_variants_new__size_variants').first()

    if not product:
        print("[ERROR] No products found in database")
        exit(1)

    print(f"[OK] Found product: {product.name}")

    # Try to serialize
    serializer = ProductListSerializerNew(product)
    data = serializer.data

    print(f"[OK] Serialization successful!")
    print(f"[OK] Product ID: {data['id']}")
    print(f"[OK] Product Name: {data['name']}")
    print(f"[OK] Tags count: {len(data.get('tags', []))}")
    print(f"[OK] Color variants count: {len(data.get('color_variants_new', []))}")

    if data.get('tags'):
        print("\nTags:")
        for tag in data['tags']:
            print(f"  - {tag['name']} ({tag['slug']})")
    else:
        print("\n[WARN] No tags assigned to this product")
        print("   Assign tags in admin: http://localhost:8000/admin/products/product/")

    print("\n[SUCCESS] ALL CHECKS PASSED!")

except Exception as e:
    print(f"\n[ERROR] {e}")
    import traceback
    traceback.print_exc()
    exit(1)
