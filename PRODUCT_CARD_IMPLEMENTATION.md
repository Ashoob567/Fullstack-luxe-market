# Product Card Redesign Implementation Guide

## Overview

This implementation adds a sophisticated product card with:
- **Color-to-Image Mapping**: Each color variant shows its specific product image
- **Dynamic Size Availability**: Only sizes available for the selected color are shown
- **Stock-Based Visibility**: Only in-stock colors and sizes are displayed
- **Direct Add-to-Cart**: Users can add items directly from the card without navigating to the detail page
- **Dark Theme Design**: Modern, visually appealing UI matching luxury e-commerce standards

## Architecture Changes

### Backend Changes

#### 1. Database Model Updates
**File**: `back-end/apps/products/models.py`

Added `color` field to `ProductImage` model to link images with specific color variants:

```python
class ProductImage(models.Model):
    # ... existing fields ...
    color = models.CharField(max_length=30, blank=True, null=True, 
                            help_text="Color variant this image represents")
```

**Migration**: `apps/products/migrations/0008_productimage_color.py`

#### 2. Serializer Updates
**File**: `back-end/apps/products/serializers.py`

**ProductImageSerializer**: Added `color` field to serialization

**ProductListSerializer**: Added three new computed fields:
- `images`: All product images with color associations
- `color_variants`: Grouped structure containing:
  ```json
  [
    {
      "color": "Cobalt Indigo",
      "image_url": "https://...",
      "sizes": [
        {
          "size": "40",
          "variant_id": "uuid",
          "sku": "SKU-001",
          "stock_qty": 10,
          "price_modifier": "0.00",
          "final_price": "8499.00"
        }
      ],
      "in_stock": true
    }
  ]
  ```
- `review_count`: Total number of reviews

The `get_color_variants()` method:
- Groups variants by color
- Only includes colors with available stock
- Links each color to its corresponding product image
- Returns all available sizes per color with pricing and stock info

### Frontend Changes

#### 1. TypeScript Type Updates
**File**: `front-end/src/types/product.ts`

Added new interfaces:
```typescript
interface ColorVariantSize {
  size: string;
  variant_id: string;
  sku: string;
  stock_qty: number;
  price_modifier: string;
  final_price: string;
}

interface ColorVariant {
  color: string;
  image_url: string | null;
  sizes: ColorVariantSize[];
  in_stock: boolean;
}
```

Updated `ProductList` interface:
- Added `description` field
- Added `images` array
- Added `color_variants` array
- Added `review_count` field

#### 2. New ProductCard Component
**File**: `front-end/src/components/products/ProductCardNew.tsx`

**Key Features**:

1. **State Management**:
   - `selectedColorIndex`: Tracks which color is currently selected
   - `selectedSize`: Tracks the selected size
   - `selectedVariant`: The complete variant object based on color + size selection

2. **Color Selector**:
   - Interactive color swatches with visual feedback
   - Maps color names to hex codes via `COLOR_HEX_MAP`
   - Automatically switches product image when color changes
   - Only shows colors with available stock

3. **Size Selector**:
   - Dynamically shows only sizes available for the selected color
   - Visual indication of selected size
   - Resets when color changes

4. **Image Switching**:
   - Displays color-specific image from `color_variants[].image_url`
   - Falls back to `primary_image` if no color-specific image exists
   - Smooth transition animations

5. **Pricing**:
   - Shows variant-specific price when size is selected
   - Displays base price otherwise
   - Shows original price with discount percentage
   - Dynamic price updates based on selection

6. **Add to Cart**:
   - "Buy Now" button triggers direct checkout
   - Validates that a size is selected before adding
   - Creates proper `CartItem` with all variant details
   - Toast notifications for user feedback

#### 3. ProductGrid Update
**File**: `front-end/src/components/products/ProductGrid.tsx`

- Switched from `ProductCard` to `ProductCardNew`
- Updated grid layout for better spacing
- Added priority loading for first 4 items (LCP optimization)

## Setup Instructions

### Backend Setup

1. **Apply the migration**:
   ```bash
   cd back-end
   source venv/Scripts/activate  # Windows: venv\Scripts\activate
   python manage.py migrate products
   ```

2. **Update existing product images with color associations**:

   You need to assign colors to existing product images. You can do this via Django admin or programmatically:

   **Via Django Admin**:
   - Go to `/admin/products/productimage/`
   - Edit each image and set the `color` field to match the variant color it represents

   **Programmatically** (Django shell):
   ```python
   python manage.py shell
   
   from apps.products.models import Product, ProductImage
   
   # Example: Assign colors to images
   product = Product.objects.get(slug='your-product-slug')
   
   # Assuming you have variants with colors
   for variant in product.variants.all():
       color = variant.color
       # Find or create an image for this color
       image = product.images.filter(color__iexact=color).first()
       if not image:
           # Assign first unassigned image to this color
           unassigned = product.images.filter(color__isnull=True).first()
           if unassigned:
               unassigned.color = color
               unassigned.save()
   ```

3. **Ensure products have proper variants**:
   
   Each product should have variants with:
   - `color`: The color name (e.g., "Cobalt Indigo", "Lagoon", "Peach")
   - `size`: The size (e.g., "40", "41", "42", "43")
   - `stock_qty`: Must be > 0 to appear in the card
   - `sku`: Unique identifier

### Frontend Setup

1. **Install dependencies** (if not already installed):
   ```bash
   cd front-end
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Verify the changes**:
   - Navigate to `/products` page
   - You should see the new dark-themed product cards
   - Test color selection → image should change
   - Test size selection → price should update
   - Test "Buy Now" → should add to cart and navigate to checkout

## Color Configuration

The component includes a `COLOR_HEX_MAP` that maps color names to hex values for the color swatches:

```typescript
const COLOR_HEX_MAP: Record<string, string> = {
  'Cobalt Indigo': '#5B6EF5',
  'Lagoon': '#00CEC9',
  'Peach': '#FF7B7B',
  'Poplar': '#FDCB6E',
  'Ocean': '#0984E3',
  'Scarlet': '#D63031',
  // ... add more as needed
};
```

**To add new colors**:
1. Add the color name and hex code to `COLOR_HEX_MAP` in `ProductCardNew.tsx`
2. Ensure your product variants use the same color name (case-insensitive matching)

## Data Flow

```
Backend:
1. Product.variants (filtered by stock_qty > 0)
2. Group by color → get available sizes per color
3. Match color to ProductImage.color → get image URL
4. Serialize as color_variants array

Frontend:
1. User selects color → updates selectedColorIndex
2. Component finds color_variants[selectedColorIndex]
3. Display image_url from selected color variant
4. Show only sizes available for that color
5. User selects size → updates selectedSize
6. Find matching variant from sizes array
7. Display variant's final_price
8. User clicks "Buy Now" → create CartItem with variant_id
```

## Testing Checklist

- [ ] Product images change when switching colors
- [ ] Only in-stock colors are visible
- [ ] Size options change based on selected color
- [ ] Price updates when selecting different sizes
- [ ] Discount badge shows correct percentage
- [ ] Wishlist button works correctly
- [ ] "Buy Now" validates size selection
- [ ] Toast notifications appear on add to cart
- [ ] Cart drawer opens with correct item details
- [ ] Checkout navigation works properly

## Common Issues & Solutions

### Issue: Colors not showing
**Solution**: Ensure:
1. Product has variants with `stock_qty > 0`
2. Variants have a `color` field set
3. ProductImages have matching `color` field

### Issue: Images not switching
**Solution**: 
1. Check that ProductImage.color matches ProductVariant.color (case-insensitive)
2. Verify image_url is properly set in ProductImage model
3. Check browser console for image loading errors

### Issue: Sizes not appearing
**Solution**:
1. Verify variants have `size` field set
2. Check that `stock_qty > 0` for those variants
3. Ensure color is selected first

### Issue: Price not updating
**Solution**:
1. Check that `price_modifier` is set correctly on variants
2. Verify `base_price` and `sale_price` are set on Product
3. Check browser console for calculation errors

## Reverting to Old Card

If you need to revert to the original ProductCard:

1. Edit `front-end/src/components/products/ProductGrid.tsx`:
   ```typescript
   // Change this:
   import { ProductCardNew } from './ProductCardNew';
   
   // Back to:
   import { ProductCard } from './ProductCard';
   
   // And change the component usage:
   <ProductCard key={product.id} product={product as any} />
   ```

## Future Enhancements

1. **Admin Interface**: Create a custom admin interface for easily assigning colors to images
2. **Bulk Operations**: Add management commands for bulk color assignment
3. **Image Upload with Color**: Modify image upload view to accept color parameter
4. **Color Swatch Images**: Support using actual product images as color swatches instead of solid colors
5. **Variant Thumbnails**: Show small preview images for each color in the selector
6. **Responsive Design**: Further optimize for mobile devices
7. **Animation**: Add smooth transitions between image changes
8. **Loading States**: Add skeleton loaders during image switching

## Performance Considerations

1. **Image Optimization**: Ensure all product images are properly optimized and served from CDN (Supabase)
2. **Lazy Loading**: The component uses Next.js Image with priority flag for above-the-fold images
3. **Memoization**: Uses React.useMemo for expensive computations
4. **API Response**: color_variants computation happens once on the backend, not per request

## Support

For issues or questions:
- Check the console for error messages
- Verify API responses in Network tab
- Review Django logs for serializer errors
- Test API endpoints directly: `GET /api/products/`
