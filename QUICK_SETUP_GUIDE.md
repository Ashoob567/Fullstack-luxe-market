# Quick Setup Guide - Product Card with Color-Image Mapping

## What Was Changed

### Backend (Django)
1. ✅ Added `color` field to `ProductImage` model
2. ✅ Created migration `0008_productimage_color.py`
3. ✅ Updated `ProductImageSerializer` to include color
4. ✅ Added `color_variants` computed field to `ProductListSerializer`
5. ✅ Added `description` to ProductList API response

### Frontend (Next.js)
1. ✅ Created new `ProductCardNew.tsx` component with dark theme
2. ✅ Updated TypeScript types with `ColorVariant` and `ColorVariantSize`
3. ✅ Updated `ProductGrid.tsx` to use new card component
4. ✅ Added color-to-image mapping logic
5. ✅ Implemented dynamic size filtering by color

## Required Setup Steps

### Step 1: Run Migration (REQUIRED)

```bash
cd back-end
source venv/Scripts/activate  # Windows: venv\Scripts\activate
python manage.py migrate products
```

This adds the `color` field to the `ProductImage` table.

### Step 2: Configure Product Data

For the new card to work properly, you need:

#### A. Products with Variants
Each product should have multiple variants with:
- **color**: "Cobalt Indigo", "Lagoon", "Peach", etc.
- **size**: "40", "41", "42", "43", "44", etc.
- **stock_qty**: Must be > 0 to appear in the card
- **sku**: Unique identifier

Example in Django Admin or shell:
```python
from apps.products.models import Product, ProductVariant

product = Product.objects.get(name="Runner Pro")

# Create variants for Cobalt Indigo color
ProductVariant.objects.create(
    product=product,
    color="Cobalt Indigo",
    size="40",
    sku="RUNNER-PRO-CI-40",
    stock_qty=10,
    price_modifier=0
)

ProductVariant.objects.create(
    product=product,
    color="Cobalt Indigo",
    size="41",
    sku="RUNNER-PRO-CI-41",
    stock_qty=5,
    price_modifier=0
)

# Repeat for other colors (Lagoon, Peach, etc.)
```

#### B. Link Images to Colors
Each color should have a corresponding product image:

```python
from apps.products.models import Product, ProductImage

product = Product.objects.get(name="Runner Pro")

# Option 1: Update existing images
cobalt_image = product.images.first()
cobalt_image.color = "Cobalt Indigo"
cobalt_image.save()

# Option 2: Upload new images via Admin
# Go to /admin/products/productimage/
# Set the 'color' field to match variant colors
```

**Important**: The `color` field in `ProductImage` must match the `color` field in `ProductVariant` (case-insensitive).

### Step 3: Verify API Response

Test your API endpoint:
```bash
curl http://localhost:8000/api/products/ | python -m json.tool
```

Look for the `color_variants` field in the response:
```json
{
  "id": "...",
  "name": "Runner Pro",
  "color_variants": [
    {
      "color": "Cobalt Indigo",
      "image_url": "https://...supabase.co/.../image.jpg",
      "sizes": [
        {
          "size": "40",
          "variant_id": "uuid-here",
          "sku": "RUNNER-PRO-CI-40",
          "stock_qty": 10,
          "final_price": "8499.00"
        }
      ],
      "in_stock": true
    }
  ]
}
```

### Step 4: Start Frontend

```bash
cd front-end
npm install
npm run dev
```

Visit `http://localhost:3000/products` to see the new product cards.

## How It Works

### Color Selection Flow
1. User opens product page → sees all available colors (with stock)
2. User clicks a color swatch → image changes to color-specific image
3. Available sizes update to show only sizes for that color
4. User selects a size → price updates to variant-specific price
5. User clicks "Buy Now" → adds exact variant to cart

### Data Structure
```
Product
├── variants (filtered by stock > 0)
│   ├── Cobalt Indigo
│   │   ├── Size 40 (stock: 10)
│   │   ├── Size 41 (stock: 5)
│   │   └── Size 42 (stock: 3)
│   └── Lagoon
│       ├── Size 40 (stock: 7)
│       └── Size 41 (stock: 2)
└── images
    ├── Image 1 (color: "Cobalt Indigo")
    ├── Image 2 (color: "Lagoon")
    └── Image 3 (color: "Peach")
```

## Example: Setting Up a Complete Product

```python
from apps.products.models import Product, ProductVariant, ProductImage, Category

# 1. Create or get product
product = Product.objects.create(
    name="Runner Pro",
    slug="runner-pro",
    description="Men's Lightweight Training Shoe",
    category=Category.objects.get(name="Shoes"),
    base_price=12000.00,
    sale_price=8499.00,
    is_featured=True,
    is_active=True
)

# 2. Create variants for multiple colors and sizes
colors = ["Cobalt Indigo", "Lagoon", "Peach", "Ocean"]
sizes = ["40", "41", "42", "43", "44"]

for color in colors:
    for size in sizes:
        ProductVariant.objects.create(
            product=product,
            color=color,
            size=size,
            sku=f"RUNNER-PRO-{color[:3].upper()}-{size}",
            stock_qty=10,  # Adjust as needed
            price_modifier=0
        )

# 3. Upload images and assign colors
# Via Django Admin or programmatically:
# - Upload image for each color
# - Set the 'color' field to match variant color

# Example if images are already uploaded:
images = product.images.all()
color_assignments = {
    images[0].id: "Cobalt Indigo",
    images[1].id: "Lagoon",
    images[2].id: "Peach",
    images[3].id: "Ocean",
}

for img_id, color in color_assignments.items():
    img = ProductImage.objects.get(id=img_id)
    img.color = color
    img.save()
```

## Adding New Colors

To add a new color to the color swatches:

1. Add to `COLOR_HEX_MAP` in `front-end/src/components/products/ProductCardNew.tsx`:
```typescript
const COLOR_HEX_MAP: Record<string, string> = {
  'Cobalt Indigo': '#5B6EF5',
  'Lagoon': '#00CEC9',
  'Peach': '#FF7B7B',
  'Your New Color': '#HEX_CODE',  // Add here
  // ...
};
```

2. Create variants with that color name
3. Upload image and set `color` field to match

## Troubleshooting

### Colors not appearing in card
- Check that variants have `stock_qty > 0`
- Verify `color` field is set on variants
- Check API response `/api/products/` for `color_variants` array

### Images not switching
- Verify `ProductImage.color` matches `ProductVariant.color`
- Check that `image_url` field is populated
- Check browser console for image loading errors

### Sizes not showing
- Verify sizes exist for the selected color
- Check that those variants have `stock_qty > 0`

### Price not updating
- Check variant `price_modifier` is set
- Verify `base_price` and `sale_price` on Product
- Check `final_price` calculation in variant model

## Testing

1. Navigate to `/products`
2. Select different colors → image should change
3. Select different sizes → price should update
4. Click "Buy Now" without size → should show error toast
5. Select size and click "Buy Now" → should add to cart
6. Check cart drawer → should show correct variant details

## Need Help?

- Review full documentation: `PRODUCT_CARD_IMPLEMENTATION.md`
- Check Django admin: `/admin/products/`
- Test API: `http://localhost:8000/api/products/`
- Check browser console for frontend errors
- Review Django logs for backend errors
