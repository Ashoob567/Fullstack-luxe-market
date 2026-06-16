# Deprecated Models Cleanup - Action Plan

## Summary
Three deprecated models need to be removed from the codebase:
1. **ProductImage** - Old image storage (use ProductColorVariant.image instead)
2. **ProductVariant** - Old flat variant structure (use ProductColorVariant + ProductSizeVariant)
3. **ProductVariantV2** - Denormalized structure that duplicates images (use ProductColorVariant + ProductSizeVariant)

## Files That Need Updates

### ✅ Already Fixed
- [x] `apps/products/admin.py` - Removed ProductVariantV2Admin and inline
- [x] `apps/products/signals.py` - Changed ProductImage to ProductColorVariant
- [x] `apps/products/models.py` - Commented out deprecated model classes

### ⚠️ Need to Fix

#### 1. `apps/products/serializers.py`
**Lines to remove:**
- Line 7: Remove `ProductImage` import
- Line 9: Remove `ProductVariant` import  
- Line 11: Remove `ProductVariantV2` import
- Lines 58-73: Remove `ProductImageSerializer` class
- Lines 80-99: Remove `ProductVariantSerializer` class
- Lines 396-424: Remove `ProductVariantV2Serializer` class
- Line 246: Update `get_images()` method to return empty list or remove
- Line 314: Remove `images` field from ProductDetailSerializer
- Line 315: Remove `variants` field from ProductDetailSerializer
- Line 445: Remove `variants` field from ProductListSerializerV2

#### 2. `apps/products/views.py`
**Lines to remove:**
- Line 22: Remove `ProductImage` from imports
- Lines 217-310: Remove entire `ProductImageUploadView` class
- Update any views that reference `images` or old `variants`

#### 3. `apps/products/urls.py`
**Lines to remove:**
- Line 10: Remove `ProductImageUploadView` import
- Line 30: Remove image upload URL pattern

#### 4. Test Files
**Files to update:**
- `apps/products/tests.py` - Remove deprecated model imports
- `apps/products/tests/test_products.py` - Remove deprecated model imports and tests

#### 5. Management Commands
**Files to update:**
- `apps/products/management/commands/seed_products.py` - Remove ProductVariant usage
- `apps/products/management/commands/fix_empty_image_urls.py` - Remove ProductVariantV2 references
- `apps/products/management/commands/fix_image_urls.py` - Remove ProductImage and ProductVariantV2 references

## Migration Strategy

### Step 1: Data Migration (If production has data)
```python
# Create a migration to copy data before deletion
python manage.py makemigrations products --empty --name backup_deprecated_data
```

### Step 2: Remove Model References
- Update all files listed above

### Step 3: Create Deletion Migration
```python
python manage.py makemigrations products --name remove_deprecated_models
```

### Step 4: Apply Migration
```python
python manage.py migrate products
```

## Current Structure (Keep This)

```
Product
  └── ProductColorVariant (color_name, hex_codes, image)
        └── ProductSizeVariant (size_name, sku, stock, price)
```

**Benefits:**
✅ Image stored once per color (normalized)
✅ Proper 3NF database design
✅ Easy to update color images
✅ Clean admin interface with nested inlines
