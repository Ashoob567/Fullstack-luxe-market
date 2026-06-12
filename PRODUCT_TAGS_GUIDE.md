# Product Tags Guide

## Overview

Product tags allow you to add visible badges to products like "NEW ARRIVAL", "SALE", "TRENDING", etc.

---

## ✅ What Was Implemented

### Backend:
1. ✅ **ProductTag model** - Already exists in database
2. ✅ **Tags in ProductListSerializerNew** - Added tags field to API response
3. ✅ **ManyToMany relationship** - Product can have multiple tags

### Frontend:
1. ✅ **Type definitions** - Added `tags?: ProductTag[]` to `ProductList` interface
2. ✅ **Badge display** - ProductCardV2 shows tag badges on product images
3. ✅ **Color-coded badges** - Different colors for different tag types

---

## 🎨 Badge Colors

The system automatically assigns colors based on tag slug:

| Tag Slug | Color | Hex | Use Case |
|----------|-------|-----|----------|
| `new-arrival` | 🟢 Green | `#10B981` | New products |
| `sale` | 🔴 Red | `#EF4444` | Products on sale |
| `trending` | 🟠 Orange | `#F59E0B` | Popular items |
| `limited-edition` | 🟣 Purple | `#8B5CF6` | Exclusive products |
| Other | 🔵 Blue | `#5B6EF5` | Default color |

---

## 📝 How to Add Tags to Products

### Method 1: Django Admin (Recommended)

1. **Create Tags:**
   - Visit: `http://localhost:8000/admin/products/producttag/`
   - Click **"Add Product Tag"**
   - Enter:
     - **Name**: `NEW ARRIVAL` (display name)
     - **Slug**: `new-arrival` (auto-generated, used for color mapping)
   - Save

2. **Common Tags to Create:**
   ```
   Name: NEW ARRIVAL    → Slug: new-arrival
   Name: SALE           → Slug: sale
   Name: TRENDING       → Slug: trending
   Name: LIMITED EDITION → Slug: limited-edition
   Name: BEST SELLER    → Slug: best-seller
   Name: HOT DEAL       → Slug: hot-deal
   ```

3. **Assign Tags to Products:**
   - Visit: `http://localhost:8000/admin/products/product/`
   - Click on a product
   - Scroll to **"Settings"** section
   - Select tags from **"Tags"** dropdown (hold Ctrl/Cmd for multiple)
   - Save

### Method 2: API (Programmatic)

**Create Tag:**
```bash
POST /api/products/tags/
{
  "name": "NEW ARRIVAL",
  "slug": "new-arrival"
}
```

**Assign Tag to Product:**
```bash
PATCH /api/products/{product_id}/
{
  "tags": ["tag-uuid-1", "tag-uuid-2"]
}
```

---

## 💻 Frontend Display

### ProductCardV2 Badge Display:

The badges are displayed on the **top-left corner** of product images:

```
┌─────────────────────────────┐
│ [SALE] [NEW ARRIVAL]        │  ← Tags badges (stacked vertically)
│                             │
│       Product Image         │
│                             │
│                         ❤️  │  ← Wishlist button
└─────────────────────────────┘
```

### Badge Stacking:
- Multiple badges stack **vertically** (column)
- Each badge has a 2px gap between them
- Discount badge appears first, then product tags

---

## 🎯 Use Cases

### 1. New Arrivals
**Tag**: `new-arrival` (Green badge)
- Mark products added in last 7-30 days
- Helps customers discover new items
- Can be automated with Django signals

### 2. Sale Products
**Tag**: `sale` (Red badge)
- Mark products with active discounts
- Alternative to percentage discount badge
- More prominent than simple "% OFF"

### 3. Trending Products
**Tag**: `trending` (Orange badge)
- Mark products with high views/sales
- Social proof for popular items
- Can be automated based on analytics

### 4. Limited Edition
**Tag**: `limited-edition` (Purple badge)
- Mark exclusive or limited stock products
- Creates urgency
- Encourages quick purchase decisions

### 5. Best Sellers
**Tag**: `best-seller` (Blue badge)
- Top-selling products
- Social proof
- Can be automated based on order count

---

## 📊 API Response Example

```json
{
  "id": "uuid",
  "name": "Cotton Shirt",
  "slug": "cotton-shirt",
  "base_price": "2000.00",
  "effective_price": "1800.00",
  "discount_percentage": "10.00",
  "is_on_sale": true,
  "primary_image": "https://...",
  
  "tags": [
    {
      "id": "tag-uuid-1",
      "name": "NEW ARRIVAL",
      "slug": "new-arrival"
    },
    {
      "id": "tag-uuid-2",
      "name": "SALE",
      "slug": "sale"
    }
  ],
  
  "color_variants_new": [...]
}
```

---

## 🔧 Customization

### Add Custom Tag Colors:

Edit [ProductCardV2.tsx](front-end/src/components/products/ProductCardV2.tsx):

```typescript
style={{
  backgroundColor: tag.slug === 'new-arrival'
    ? '#10B981' // Green
    : tag.slug === 'your-custom-slug'
    ? '#YOUR_COLOR' // Your custom color
    : BRAND_COLORS.accentBlue // Default
}}
```

### Change Badge Position:

Current: Top-left corner
```typescript
<div className="absolute top-3 left-3 flex flex-col gap-2">
```

To change to top-right:
```typescript
<div className="absolute top-3 right-3 flex flex-col gap-2">
```

### Badge Styling:

Current style:
```typescript
className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
```

Customizable properties:
- `px-3 py-1` - Padding (horizontal, vertical)
- `rounded-full` - Border radius (full = pill shape)
- `text-xs` - Font size
- `font-bold` - Font weight
- `uppercase` - Text transform

---

## 🚀 Automation Ideas

### 1. Auto-tag New Arrivals (Django Signals):

```python
# apps/products/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Product, ProductTag

@receiver(post_save, sender=Product)
def auto_tag_new_arrival(sender, instance, created, **kwargs):
    if created:
        new_arrival_tag, _ = ProductTag.objects.get_or_create(
            slug='new-arrival',
            defaults={'name': 'NEW ARRIVAL'}
        )
        instance.tags.add(new_arrival_tag)
```

### 2. Auto-tag Sale Products:

```python
@receiver(post_save, sender=Product)
def auto_tag_sale(sender, instance, **kwargs):
    sale_tag, _ = ProductTag.objects.get_or_create(
        slug='sale',
        defaults={'name': 'SALE'}
    )
    
    if instance.is_on_sale or instance.is_flash_active:
        instance.tags.add(sale_tag)
    else:
        instance.tags.remove(sale_tag)
```

### 3. Scheduled Task (Remove OLD "NEW ARRIVAL" tags):

```python
# management/commands/cleanup_new_arrival_tags.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Product, ProductTag

class Command(BaseCommand):
    help = 'Remove NEW ARRIVAL tag from products older than 30 days'

    def handle(self, *args, **kwargs):
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_arrival_tag = ProductTag.objects.get(slug='new-arrival')
        
        old_products = Product.objects.filter(
            created_at__lt=thirty_days_ago,
            tags=new_arrival_tag
        )
        
        for product in old_products:
            product.tags.remove(new_arrival_tag)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Removed NEW ARRIVAL tag from {old_products.count()} products'
            )
        )
```

Run with cron:
```bash
0 0 * * * cd /path/to/project && python manage.py cleanup_new_arrival_tags
```

---

## 📋 Checklist for Using Tags

- [ ] Create common tags in admin (NEW ARRIVAL, SALE, TRENDING, etc.)
- [ ] Assign tags to products
- [ ] Test frontend display on product cards
- [ ] Verify badge colors match tag slugs
- [ ] Check mobile responsiveness
- [ ] Set up automation (optional)

---

## 🎨 Visual Preview

### Product Card with Tags:

```
┌─────────────────────────────┐
│ [10% OFF] 🔵                │  ← Discount badge
│ [NEW ARRIVAL] 🟢            │  ← Product tag (green)
│ [SALE] 🔴                   │  ← Product tag (red)
│                             │
│       Product Image         │
│                             │
│                         ❤️  │
└─────────────────────────────┘
│ Category                    │
│ Product Name                │
│ ⭐⭐⭐⭐⭐ 4.5 (23 reviews) │
│ Rs. 1,800  Rs. 2,000        │
│ COLOR: [●] [●] [●]          │
│ SIZE: [M] [L] [XL]          │
│ [Buy Now - Rs. 1,800]       │
└─────────────────────────────┘
```

---

## ✅ Benefits

1. **Visual Appeal** - Eye-catching badges attract attention
2. **Clear Communication** - Instantly convey product status
3. **Urgency** - Tags like "SALE" or "LIMITED EDITION" encourage quick action
4. **Discovery** - Help customers find new or trending items
5. **Flexible** - Easy to add/remove tags without code changes
6. **Color-coded** - Different colors for different tag types
7. **Multiple Tags** - Products can have multiple badges

---

## 🐛 Troubleshooting

### Tags not showing on frontend?

1. Check API response includes `tags` field:
   ```bash
   curl http://localhost:8000/api/products/ | jq '.results[0].tags'
   ```

2. Verify ProductListSerializerNew includes tags:
   ```python
   # apps/products/serializers.py
   class ProductListSerializerNew(...):
       tags = ProductTagSerializer(many=True, read_only=True)
   ```

3. Check TypeScript types include tags:
   ```typescript
   // types/product.ts
   export interface ProductList {
     tags?: ProductTag[];
   }
   ```

### Wrong badge color?

Check tag slug matches color mapping in ProductCardV2.tsx:
```typescript
tag.slug === 'new-arrival' ? '#10B981' : ...
```

### Badges overlapping?

Adjust gap between badges:
```typescript
<div className="flex flex-col gap-2">  {/* Change gap-2 to gap-3 */}
```

---

## 📚 Related Files

**Backend:**
- [models.py](back-end/apps/products/models.py) - ProductTag model
- [serializers.py](back-end/apps/products/serializers.py) - ProductListSerializerNew with tags
- [admin.py](back-end/apps/products/admin.py) - ProductTag admin

**Frontend:**
- [product.ts](front-end/src/types/product.ts) - ProductTag interface
- [ProductCardV2.tsx](front-end/src/components/products/ProductCardV2.tsx) - Badge display

---

**Ab tumhare products proper tags ke sath badges show karenge!** 🎉

Examples:
- **NEW ARRIVAL** → Green badge 🟢
- **SALE** → Red badge 🔴
- **TRENDING** → Orange badge 🟠
- **LIMITED EDITION** → Purple badge 🟣
