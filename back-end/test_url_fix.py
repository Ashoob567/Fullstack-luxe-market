"""
Quick test script to verify URL fixing logic.
Run: python test_url_fix.py
"""

def fix_url(url):
    """Fix image URL path issues"""
    if not url:
        return url

    # Fix missing subdirectory paths
    base_path = 'products/images/'
    if base_path in url:
        parts = url.split(base_path, 1)
        if len(parts) == 2:
            base_url = parts[0] + base_path
            remaining_path = parts[1]

            # Skip if already has proper subdirectory structure
            if remaining_path.startswith(('categories/', 'products/')):
                return url

            # Direct filename without subdirectory - needs fixing
            url = base_url + 'products/' + remaining_path

    return url


def fix_url_for_color_variant(url):
    """Specific fix for color variant images - should be in products/colors/"""
    if not url:
        return url

    # First apply general fixes
    url = fix_url(url)

    # Then ensure it's in the colors subdirectory
    base_path = 'products/images/products/'
    if base_path in url and '/colors/' not in url:
        parts = url.split(base_path, 1)
        if len(parts) == 2 and '/' not in parts[1]:  # Direct filename
            url = parts[0] + base_path + 'colors/' + parts[1]

    return url


# Test cases
test_urls = [
    # BROKEN: Missing nested path (should be in products/colors/)
    ("ProductImage", "https://iljvzwluibwuxyjavpwb.supabase.co/storage/v1/object/public/luxe-market-media/products/images/strip3.jpeg"),

    # BROKEN: Color variant with missing colors/ subdirectory
    ("ColorVariant", "https://iljvzwluibwuxyjavpwb.supabase.co/storage/v1/object/public/luxe-market-media/products/images/strip3.jpeg"),

    # CORRECT: Full path with colors subdirectory
    ("ColorVariant", "https://iljvzwluibwuxyjavpwb.supabase.co/storage/v1/object/public/luxe-market-media/products/images/products/colors/strip3.jpeg"),

    # CORRECT: Category images
    ("Category", "https://iljvzwluibwuxyjavpwb.supabase.co/storage/v1/object/public/luxe-market-media/products/images/categories/shoe.jpg"),
]

print("\nExpected fixes:")
print("  ProductImage:   strip3.jpeg -> products/images/products/strip3.jpeg")
print("  ColorVariant:   strip3.jpeg -> products/images/products/colors/strip3.jpeg")
print()

print("URL Fix Test Results:")
print("=" * 80)

for model_type, url in test_urls:
    if model_type == "ColorVariant":
        fixed = fix_url_for_color_variant(url)
    else:
        fixed = fix_url(url)

    status = "[FIXED]" if url != fixed else "[OK]"
    print(f"\n{status} ({model_type})")
    print(f"  FROM: {url}")
    if url != fixed:
        print(f"  TO:   {fixed}")
print("\n" + "=" * 80)
