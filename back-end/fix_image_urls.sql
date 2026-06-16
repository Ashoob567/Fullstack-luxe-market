-- Fix Image URLs in Database
-- This SQL script adds the missing "products/colors/" path to broken image URLs

-- Preview what will be changed (run this first)
SELECT
    'products_productcolorvariant' AS table_name,
    id,
    color_name,
    image_url AS old_url,
    REPLACE(image_url, 'products/images/', 'products/images/products/colors/') AS new_url
FROM products_productcolorvariant
WHERE image_url LIKE '%products/images/%'
  AND image_url NOT LIKE '%products/images/products/%'
  AND image_url NOT LIKE '%products/images/categories/%'

UNION ALL

SELECT
    'products_productimage' AS table_name,
    id::text,
    'N/A' AS color_name,
    image_url AS old_url,
    REPLACE(image_url, 'products/images/', 'products/images/products/') AS new_url
FROM products_productimage
WHERE image_url LIKE '%products/images/%'
  AND image_url NOT LIKE '%products/images/products/%'
  AND image_url NOT LIKE '%products/images/categories/%'

UNION ALL

SELECT
    'products_productvariantv2' AS table_name,
    id::text,
    color_name,
    image_url AS old_url,
    REPLACE(image_url, 'products/images/', 'products/images/products/variants/') AS new_url
FROM products_productvariantv2
WHERE image_url LIKE '%products/images/%'
  AND image_url NOT LIKE '%products/images/products/%'
  AND image_url NOT LIKE '%products/images/categories/%';

-- ================================================================================
-- If the preview looks correct, run these UPDATE statements:
-- ================================================================================

-- Fix ProductColorVariant URLs (color variant images)
UPDATE products_productcolorvariant
SET image_url = REPLACE(image_url, 'products/images/', 'products/images/products/colors/')
WHERE image_url LIKE '%products/images/%'
  AND image_url NOT LIKE '%products/images/products/%'
  AND image_url NOT LIKE '%products/images/categories/%';

-- Fix ProductImage URLs (general product images)
UPDATE products_productimage
SET image_url = REPLACE(image_url, 'products/images/', 'products/images/products/')
WHERE image_url LIKE '%products/images/%'
  AND image_url NOT LIKE '%products/images/products/%'
  AND image_url NOT LIKE '%products/images/categories/%';

-- Fix ProductVariantV2 URLs (unified variant images)
UPDATE products_productvariantv2
SET image_url = REPLACE(image_url, 'products/images/', 'products/images/products/variants/')
WHERE image_url LIKE '%products/images/%'
  AND image_url NOT LIKE '%products/images/products/%'
  AND image_url NOT LIKE '%products/images/categories/%';

-- Show results
SELECT 'Fixed!' AS status;
