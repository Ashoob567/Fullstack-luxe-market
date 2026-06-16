"""
Fix color variants with empty image URLs (path but no filename)
Run: python fix_empty_image_urls.py --apply
"""
import psycopg2
from pathlib import Path
import os
import sys

# Load .env
env_file = Path('.env')
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

from urllib.parse import urlparse
DATABASE_URL = os.getenv('DATABASE_URL')
result = urlparse(DATABASE_URL)

conn = psycopg2.connect(
    database=result.path[1:],
    user=result.username,
    password=result.password,
    host=result.hostname,
    port=result.port
)

cur = conn.cursor()
dry_run = '--apply' not in sys.argv

print("=" * 80)
print("FIX EMPTY IMAGE URLS")
print("=" * 80)

if dry_run:
    print("\n[DRY RUN] No changes will be made\n")
else:
    print("\n[APPLYING FIXES]\n")

# Find variants with incomplete URLs (path but no filename)
cur.execute("""
    SELECT id, color_name, image_url, product_id
    FROM products_productcolorvariant
    WHERE image_url LIKE '%products/colors/'
       OR image_url LIKE '%products/colors'
""")

variants = cur.fetchall()
print(f"Found {len(variants)} color variants with incomplete image URLs\n")

for variant_id, color_name, old_url, product_id in variants:
    print(f"Color: {color_name}")
    print(f"  OLD: {old_url}")
    print(f"  NEW: NULL (will use fallback/placeholder)")
    print()

    if not dry_run:
        # Set to empty string so frontend can handle with fallback
        cur.execute("""
            UPDATE products_productcolorvariant
            SET image_url = ''
            WHERE id = %s
        """, (variant_id,))

if not dry_run:
    conn.commit()
    print("=" * 80)
    print(f"[SUCCESS] Fixed {len(variants)} incomplete URLs")
    print("=" * 80)
else:
    print("=" * 80)
    print(f"Would fix {len(variants)} URLs")
    print("Run with --apply to make changes")
    print("=" * 80)

cur.close()
conn.close()
