"""
Direct database fix for image URLs - No Django required
Run: python fix_urls_direct.py
"""
import os
import psycopg2
from urllib.parse import urlparse
from pathlib import Path

# Load .env file
env_file = Path(__file__).parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

# Database connection from .env
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres.iljvzwluibwuxyjavpwb:Ashoob67!!%@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres')

def fix_image_urls(dry_run=True):
    """Fix broken image URLs in the database"""

    # Parse database URL
    result = urlparse(DATABASE_URL)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port

    # Connect to database
    conn = psycopg2.connect(
        database=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )

    cur = conn.cursor()

    print("=" * 80)
    print("IMAGE URL FIX SCRIPT")
    print("=" * 80)

    if dry_run:
        print("\n[DRY RUN] No changes will be made\n")
    else:
        print("\n[APPLYING FIXES]\n")

    # Fix ProductColorVariant URLs
    print("\n--- ProductColorVariant (Color Variant Images) ---")
    cur.execute("""
        SELECT id, color_name, image_url
        FROM products_productcolorvariant
        WHERE image_url LIKE '%products/images/%'
          AND image_url NOT LIKE '%products/images/products/%'
          AND image_url NOT LIKE '%products/images/categories/%'
    """)

    color_variants = cur.fetchall()
    print(f"Found {len(color_variants)} URLs to fix")

    for row in color_variants:
        id, color_name, old_url = row
        new_url = old_url.replace('products/images/', 'products/images/products/colors/')
        print(f"  {color_name}:")
        print(f"    OLD: {old_url}")
        print(f"    NEW: {new_url}")

        if not dry_run:
            cur.execute("""
                UPDATE products_productcolorvariant
                SET image_url = %s
                WHERE id = %s
            """, (new_url, id))

    # Commit the color variant changes before proceeding
    if not dry_run:
        conn.commit()
        print("\n[Committed color variant changes]")

    # Fix ProductImage URLs
    print("\n--- ProductImage (Product Images) ---")
    try:
        cur.execute("""
            SELECT id, image_url
            FROM products_productimage
            WHERE image_url LIKE '%products/images/%'
              AND image_url NOT LIKE '%products/images/products/%'
              AND image_url NOT LIKE '%products/images/categories/%'
        """)

        product_images = cur.fetchall()
        print(f"Found {len(product_images)} URLs to fix")

        for row in product_images:
            id, old_url = row
            new_url = old_url.replace('products/images/', 'products/images/products/')
            print(f"  Image {id}:")
            print(f"    OLD: {old_url}")
            print(f"    NEW: {new_url}")

            if not dry_run:
                cur.execute("""
                    UPDATE products_productimage
                    SET image_url = %s
                    WHERE id = %s
                """, (new_url, id))
    except Exception as e:
        print(f"Skipped: {e}")
        product_images = []
        conn.rollback()  # Reset transaction

    # Fix ProductVariantV2 URLs
    print("\n--- ProductVariantV2 (Unified Variant Images) ---")
    try:
        cur.execute("""
            SELECT id, color_name, image_url
            FROM products_productvariantv2
            WHERE image_url LIKE '%products/images/%'
              AND image_url NOT LIKE '%products/images/products/%'
              AND image_url NOT LIKE '%products/images/categories/%'
        """)

        variant_v2 = cur.fetchall()
        print(f"Found {len(variant_v2)} URLs to fix")

        for row in variant_v2:
            id, color_name, old_url = row
            new_url = old_url.replace('products/images/', 'products/images/products/variants/')
            print(f"  {color_name}:")
            print(f"    OLD: {old_url}")
            print(f"    NEW: {new_url}")

            if not dry_run:
                cur.execute("""
                    UPDATE products_productvariantv2
                    SET image_url = %s
                    WHERE id = %s
                """, (new_url, id))

        if not dry_run and len(variant_v2) > 0:
            conn.commit()
            print("\n[Committed variant V2 changes]")
    except Exception as e:
        print(f"Skipped: {e}")
        variant_v2 = []
        if not dry_run:
            conn.rollback()

    # Summary
    if not dry_run:
        print("\n" + "=" * 80)
        print(f"[SUCCESS] Fixed {len(color_variants) + len(product_images) + len(variant_v2)} URLs")
        print("=" * 80)
    else:
        print("\n" + "=" * 80)
        print(f"Would fix {len(color_variants) + len(product_images) + len(variant_v2)} URLs")
        print("Run with --apply to make changes")
        print("=" * 80)

    cur.close()
    conn.close()


if __name__ == "__main__":
    import sys

    # Check if --apply flag is provided
    dry_run = '--apply' not in sys.argv

    try:
        fix_image_urls(dry_run=dry_run)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        print("\nMake sure DATABASE_URL is set in your .env file or environment")
        sys.exit(1)
