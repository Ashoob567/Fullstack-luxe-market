# Visual Structure Diagram 📊

## Complete New Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCT TABLE                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ id: UUID                                                  │   │
│  │ name: "Runner Pro"                                        │   │
│  │ slug: "runner-pro"                                        │   │
│  │ description: "Men's Lightweight Training Shoe"            │   │
│  │ base_price: 12000.00                                      │   │
│  │ sale_price: 8499.00                                       │   │
│  │ category: Foreign Key → Category                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ ONE Product has MANY ColorVariants
             │
        ┌────┴─────┬──────────┬──────────┐
        │          │          │          │
        ▼          ▼          ▼          ▼
┌──────────────────────────────────────────────────────────┐
│         PRODUCT COLOR VARIANT TABLE                       │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │ VARIANT 1: Cobalt Indigo                             │ │
│ │ ─────────────────────────                            │ │
│ │ id: uuid-001                                         │ │
│ │ product_id: → Product (Runner Pro)                   │ │
│ │ color_name: "Cobalt Indigo"                          │ │
│ │ hex_primary: #5B6EF5                                 │ │
│ │ hex_light: #7B8EF7                                   │ │
│ │ hex_dark: #4A5DD4                                    │ │
│ │ ┌──────────────────────────────────────────────────┐ │ │
│ │ │ IMAGE (DIRECTLY ATTACHED!)                       │ │ │
│ │ │ image: products/colors/runner-cobalt.jpg         │ │ │
│ │ │ image_url: https://supabase.co/.../cobalt.jpg    │ │ │
│ │ └──────────────────────────────────────────────────┘ │ │
│ │ is_active: true                                      │ │
│ │ display_order: 0                                     │ │
│ └──────┬───────────────────────────────────────────────┘ │
│        │                                                  │
│        │ ONE ColorVariant has MANY SizeVariants           │
│        │                                                  │
│   ┌────┴─────┬────────┬────────┐                         │
│   │          │        │        │                         │
│   ▼          ▼        ▼        ▼                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │      PRODUCT SIZE VARIANT TABLE (Cobalt Sizes)       │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │ Size 40                                              │ │
│ │ ├─ color_variant_id: → uuid-001                      │ │
│ │ ├─ size_name: "40"                                   │ │
│ │ ├─ sku: "RUNNER-CI-40"                               │ │
│ │ ├─ stock_quantity: 10                                │ │
│ │ └─ price_adjustment: 0.00                            │ │
│ │                                                      │ │
│ │ Size 41                                              │ │
│ │ ├─ size_name: "41"                                   │ │
│ │ ├─ sku: "RUNNER-CI-41"                               │ │
│ │ ├─ stock_quantity: 5                                 │ │
│ │ └─ price_adjustment: 0.00                            │ │
│ │                                                      │ │
│ │ Size 42                                              │ │
│ │ ├─ size_name: "42"                                   │ │
│ │ ├─ sku: "RUNNER-CI-42"                               │ │
│ │ ├─ stock_quantity: 8                                 │ │
│ │ └─ price_adjustment: 0.00                            │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ VARIANT 2: Lagoon                                    │ │
│ │ ─────────────────────                                │ │
│ │ color_name: "Lagoon"                                 │ │
│ │ hex_primary: #00CEC9                                 │ │
│ │ image: products/colors/runner-lagoon.jpg             │ │
│ │ ├─ Size 40 (stock: 7)                                │ │
│ │ ├─ Size 41 (stock: 4)                                │ │
│ │ └─ Size 43 (stock: 6)                                │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ VARIANT 3: Peach                                     │ │
│ │ ─────────────────                                    │ │
│ │ color_name: "Peach"                                  │ │
│ │ hex_primary: #FF7B7B                                 │ │
│ │ image: products/colors/runner-peach.jpg              │ │
│ │ ├─ Size 40 (stock: 5)                                │ │
│ │ ├─ Size 41 (stock: 8)                                │ │
│ │ └─ Size 42 (stock: 11)                               │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   USER OPENS PRODUCT PAGE                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────────┐
        │  Load Product Data from API               │
        │  GET /api/products/runner-pro/            │
        └────────────────┬──────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │  Parse color_variants_new Array            │
        │  [                                         │
        │    {color: "Cobalt Indigo", image: ...},   │
        │    {color: "Lagoon", image: ...},          │
        │    {color: "Peach", image: ...}            │
        │  ]                                         │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │  Display First Color by Default            │
        │  • Show: runner-cobalt.jpg                 │
        │  • Color swatch: #5B6EF5                   │
        │  • Available sizes: 40, 41, 42             │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │      USER CLICKS "Lagoon" COLOR            │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │  State Update: selectedColorIndex = 1      │
        │  • Image changes to: runner-lagoon.jpg     │
        │  • Sizes update to: 40, 41, 43             │
        │  • Size selection reset                    │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │       USER SELECTS SIZE "40"               │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │  State Update: selectedSizeId = uuid       │
        │  • Price updates to: 8499.00               │
        │  • Display SKU: RUNNER-LAG-40              │
        │  • Show stock: 7 available                 │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │      USER CLICKS "BUY NOW"                 │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │  Create Cart Item:                         │
        │  {                                         │
        │    product_id: "prod-uuid",                │
        │    variant_id: "size-variant-uuid",        │
        │    name: "Runner Pro",                     │
        │    color: "Lagoon",                        │
        │    size: "40",                             │
        │    sku: "RUNNER-LAG-40",                   │
        │    price: "8499.00",                       │
        │    image: "runner-lagoon.jpg",             │
        │    quantity: 1                             │
        │  }                                         │
        └────────────────┬───────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────────┐
        │  Add to Cart + Navigate to Checkout        │
        └────────────────────────────────────────────┘
```

---

## API Response Structure

```json
{
  "id": "prod-uuid",
  "name": "Runner Pro",
  "color_variants_new": [
    {
      "id": "color-uuid-1",
      "color_name": "Cobalt Indigo",
      "hex_primary": "#5B6EF5",
      "hex_light": "#7B8EF7",
      "hex_dark": "#4A5DD4",
      "image_url": "https://supabase.co/.../runner-cobalt.jpg",
      "is_in_stock": true,
      "total_stock": 23,
      "size_variants": [
        {
          "id": "size-uuid-1",
          "size_name": "40",
          "sku": "RUNNER-CI-40",
          "stock_quantity": 10,
          "price_adjustment": "0.00",
          "is_in_stock": true,
          "final_price": "8499.00"
        },
        {
          "id": "size-uuid-2",
          "size_name": "41",
          "sku": "RUNNER-CI-41",
          "stock_quantity": 5,
          "final_price": "8499.00"
        }
      ]
    },
    {
      "id": "color-uuid-2",
      "color_name": "Lagoon",
      "hex_primary": "#00CEC9",
      "image_url": "https://supabase.co/.../runner-lagoon.jpg",
      "size_variants": [
        {
          "size_name": "40",
          "sku": "RUNNER-LAG-40",
          "stock_quantity": 7
        }
      ]
    }
  ]
}
```

---

## Admin Interface Hierarchy

```
Django Admin
│
├── Products
│   ├── Add Product
│   │   ├─ Name: "Runner Pro"
│   │   ├─ Slug: "runner-pro"
│   │   ├─ Base Price: 12000
│   │   └─ Category: Shoes
│   │
│   └── Product Admin Page
│       └─ [Inline] Color Variants (collapsed preview)
│
├── Product Color Variants
│   ├── Add Color Variant
│   │   ├─ Product: Runner Pro
│   │   ├─ Color Name: "Cobalt Indigo"
│   │   ├─ Hex Primary: #5B6EF5
│   │   ├─ Upload Image: runner-cobalt.jpg
│   │   ├─ Display Order: 0
│   │   │
│   │   └─ [Inline] Size Variants
│   │       ├─ Size 40 | SKU: RUNNER-CI-40 | Stock: 10
│   │       ├─ Size 41 | SKU: RUNNER-CI-41 | Stock: 5
│   │       └─ Size 42 | SKU: RUNNER-CI-42 | Stock: 8
│   │
│   └── Color Variant List
│       ├─ Runner Pro - Cobalt Indigo (#5B6EF5) | Stock: 23
│       ├─ Runner Pro - Lagoon (#00CEC9) | Stock: 11
│       └─ Runner Pro - Peach (#FF7B7B) | Stock: 24
│
└── Product Size Variants
    ├── Size Variant List
    │   ├─ Cobalt Indigo - 40 (RUNNER-CI-40) | Stock: 10
    │   ├─ Cobalt Indigo - 41 (RUNNER-CI-41) | Stock: 5
    │   ├─ Lagoon - 40 (RUNNER-LAG-40) | Stock: 7
    │   └─ ...
    │
    └── Quick Edit (in list view)
        └─ Update stock quantities inline
```

---

## Data Relationships (ERD Style)

```
┌──────────────┐
│   Product    │
└──────┬───────┘
       │ 1
       │
       │ N
       ▼
┌──────────────────────┐
│ ProductColorVariant  │
│ ─────────────────    │
│ • color_name         │
│ • hex_primary        │◄─┐
│ • hex_light          │  │
│ • hex_dark           │  │  Direct Attachment
│ • image (ImageField) │  │  (No string matching!)
│ • image_url          │  │
│ • is_active          │  │
│ • display_order      │  │
└──────┬───────────────┘  │
       │ 1                │
       │                  │
       │ N                │
       ▼                  │
┌──────────────────────┐  │
│ ProductSizeVariant   │  │
│ ─────────────────    │  │
│ • size_name          │  │
│ • sku (unique)       │  │
│ • stock_quantity     │  │
│ • price_adjustment   │  │
│ • is_active          │  │
│ • display_order      │  │
└──────────────────────┘  │
                          │
                          │
        Image directly    │
        linked via FK ────┘
        (NOT via string!)
```

---

## Frontend Component Structure

```
ProductCardV2
├── State
│   ├── selectedColorIndex (0-based)
│   └── selectedSizeId (UUID)
│
├── Computed Values
│   ├── availableColors (from color_variants_new)
│   ├── selectedColor (availableColors[index])
│   ├── displayImage (selectedColor.image_url)
│   ├── availableSizes (selectedColor.size_variants)
│   ├── selectedSize (find by selectedSizeId)
│   └── displayPrice (selectedSize.final_price || effective_price)
│
├── Event Handlers
│   ├── handleColorChange(index)
│   │   ├─ Update selectedColorIndex
│   │   └─ Reset selectedSizeId
│   │
│   ├── handleSizeClick(sizeId)
│   │   └─ Update selectedSizeId
│   │
│   ├── handleWishlist()
│   │   └─ Toggle wishlist with current display state
│   │
│   └── handleBuyNow()
│       ├─ Validate size selected
│       ├─ Create CartItem with variant details
│       └─ Navigate to checkout
│
└── Render
    ├── Image (displayImage with smooth transition)
    ├── Product Info (name, category, rating)
    ├── Price (displayPrice with discount badge)
    ├── Size Selector (availableSizes mapped to buttons)
    ├── Color Selector (hex_primary for swatch color)
    └── Buy Now Button (disabled until size selected)
```

---

## Summary in Boxes

```
┌─────────────────────────────────────────────────────────┐
│                    ✅ ACHIEVEMENTS                        │
├─────────────────────────────────────────────────────────┤
│ [✓] Direct Product → Color → Size hierarchy             │
│ [✓] Image directly attached to color (FK, not string)   │
│ [✓] Hex colors in database (no hardcoded frontend map)  │
│ [✓] Clean admin interface with nested inlines           │
│ [✓] Type-safe TypeScript interfaces                     │
│ [✓] Frontend component using new structure              │
│ [✓] Complete documentation with examples                │
│ [✓] Migration created and ready to run                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    📋 NEXT STEPS                         │
├─────────────────────────────────────────────────────────┤
│ 1. Run: python manage.py migrate products               │
│ 2. Create color variants via Django admin               │
│ 3. Test API: GET /api/products/                         │
│ 4. Test frontend with ProductCardV2                     │
│ 5. Gradually migrate existing products                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   🎯 KEY BENEFITS                        │
├─────────────────────────────────────────────────────────┤
│ • No manual color string matching                       │
│ • Database-driven hex colors                            │
│ • FK integrity ensures data consistency                 │
│ • Scalable and maintainable                             │
│ • Easy to add new colors via admin only                 │
│ • Stock management at correct level                     │
└─────────────────────────────────────────────────────────┘
```

---

**Perfect structure jo aap chahte the - Product → Color (with image) → Sizes! 🎉**
