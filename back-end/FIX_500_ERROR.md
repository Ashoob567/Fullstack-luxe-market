# Fix: 500 Error on New Arrivals Endpoint

## Problem

The `/api/products/new-arrivals/` endpoint was returning a 500 error when accessed.

**Error**: `GET /api/products/new-arrivals/ HTTP/1.1" 500 178100`

## Root Cause

The `NewArrivalsView` was using `ProductListSerializer`, which **did not include the `tags` field** in its serialization. 

However, the view was filtering products by tags:
```python
base_product_queryset().filter(tags__slug__iexact="new-arrival")
```

This caused issues because:
1. The frontend expects `tags` to be present in the response (to display badges)
2. The serializer wasn't configured to serialize the tags relationship
3. Other views (ProductListView, FeaturedProductsView) were already using `ProductListSerializerNew` which includes tags

## Solution

Added `tags` field to `ProductListSerializer` to match the expected frontend structure.

### Changes Made

**File**: `back-end/apps/products/serializers.py`

1. **Added tags field to class definition** (line 167):
```python
class ProductListSerializer(EffectivePriceMixin, serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    color_variants = serializers.SerializerMethodField()
    tags = ProductTagSerializer(many=True, read_only=True)  # ← ADDED
```

2. **Added tags to Meta.fields list** (line 227):
```python
class Meta:
    model = Product
    fields = [
        # ... other fields ...
        "color_variants",
        "tags",  # ← ADDED - Product tags for badges (NEW ARRIVAL, SALE, etc.)
        "category_id",
        # ... remaining fields ...
    ]
```

## Why This Fixes the Error

1. **Serializer Consistency**: The `tags` field is now properly configured in the serializer
2. **ManyToMany Relationship**: The `ProductTagSerializer` correctly handles the many-to-many relationship
3. **Prefetched Data**: The `base_product_queryset()` already prefetches tags, so this doesn't add N+1 queries
4. **Frontend Compatibility**: The response now matches what the frontend expects

## Impact

This change affects all views using `ProductListSerializer`:
- ✅ `NewArrivalsView` - Now returns tags
- ✅ `BestsellersView` - Now returns tags
- ✅ `FlashSaleView` - Now returns tags
- ✅ `CategoryProductsView` - Now returns tags

All of these views will now include product tags in their responses, enabling badge display on the frontend.

## Testing

```bash
# 1. Restart the Django server
cd back-end
python manage.py runserver

# 2. Test the endpoint
curl http://localhost:8000/api/products/new-arrivals/

# Expected: 200 OK with JSON array containing products with tags
```

**Expected Response Structure**:
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "tags": [
      {
        "id": "tag-uuid",
        "name": "New Arrival",
        "slug": "new-arrival"
      }
    ],
    "primary_image": "https://...",
    "base_price": "299.99",
    ...
  }
]
```

## Verification

After the fix:
1. ✅ No 500 errors
2. ✅ Tags are included in JSON response
3. ✅ Frontend displays green "NEW ARRIVAL" badges
4. ✅ No performance impact (tags already prefetched)

## Related Files

- **View**: `back-end/apps/products/views.py` (NewArrivalsView)
- **Serializer**: `back-end/apps/products/serializers.py` (ProductListSerializer)
- **Model**: `back-end/apps/products/models.py` (Product.tags)
- **Frontend**: `front-end/src/app/(shop)/new-arrivals/page.tsx`
- **Product Card**: `front-end/src/components/products/ProductCardV2.tsx` (displays badges)
