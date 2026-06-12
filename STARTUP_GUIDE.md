# 🚀 Luxe Market - Startup Guide

## Quick Start

### Backend (Django)

```bash
# 1. Navigate to backend
cd back-end

# 2. Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Install dependencies (if needed)
pip install -r requirements/base.txt

# 4. Run server
python manage.py runserver

# Server will start at: http://localhost:8000
```

### Frontend (Next.js)

```bash
# 1. Navigate to frontend
cd front-end

# 2. Install dependencies (if needed)
npm install

# 3. Run development server
npm run dev

# Server will start at: http://localhost:3000
```

---

## ✅ What's Been Implemented

### 1. **Normalized Product Structure**
- ✅ Product → ColorVariant → SizeVariant (proper 3NF)
- ✅ Image stored once per color (efficient!)
- ✅ Nested admin inline (one-page product entry)
- ✅ Optimized queries with prefetch

### 2. **Product Tags & Badges**
- ✅ NEW ARRIVAL badge (Green)
- ✅ SALE badge (Red)
- ✅ TRENDING badge (Orange)
- ✅ LIMITED EDITION badge (Purple)
- ✅ FLASH SALE badge (Red, animated)
- ✅ Discount percentage badge (Blue)

### 3. **API Integration**
- ✅ ProductListSerializerNew with tags
- ✅ Optimized queryset with prefetch
- ✅ All views updated to use new serializer

### 4. **Frontend Components**
- ✅ ProductCardV2 with badge display
- ✅ All pages using ProductCardV2
- ✅ Color-coded tag badges
- ✅ Animated flash sale badge

---

## 📊 Test the Implementation

### 1. **Test Backend API**

```bash
# Check API endpoint
curl http://localhost:8000/api/products/ | jq '.results[0]' | head -50
```

**Expected Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "tags": [
    {"id": "uuid", "name": "NEW ARRIVAL", "slug": "new-arrival"}
  ],
  "color_variants_new": [
    {
      "id": "uuid",
      "color_name": "Red",
      "image_url": "https://...",
      "size_variants": [
        {"size_name": "M", "stock_quantity": 10}
      ]
    }
  ]
}
```

### 2. **Test Serializer**

```bash
cd back-end
./venv/Scripts/python test_serializer.py
```

**Expected Output:**
```
[OK] Found product: Product Name
[OK] Serialization successful!
[OK] Tags count: 1
[OK] Color variants count: 3
[SUCCESS] ALL CHECKS PASSED!
```

### 3. **Test Admin Interface**

Visit: `http://localhost:8000/admin/products/product/add/`

**You should see:**
- Product fields
- Product Color Variants (inline)
  - Color name, hex, image upload
  - **Nested Size Variants** (inside each color)
    - Size name, SKU, stock

**Add a product:**
1. Fill product details
2. Add color → upload image
3. Add sizes within that color
4. Save (one click!)

### 4. **Test Frontend**

Visit pages:
- Home: `http://localhost:3000/`
- Products: `http://localhost:3000/products`
- Wishlist: `http://localhost:3000/account/wishlist`

**You should see:**
- Product cards with badges
- Color swatches (clickable)
- Size options
- Flash sale badges (if active)
- Product tag badges (NEW ARRIVAL, etc.)

---

## 🏷️ Add Product Tags

### Create Tags:

1. Visit: `http://localhost:8000/admin/products/producttag/add/`

2. **Create these common tags:**

| Name | Slug | Badge Color |
|------|------|-------------|
| NEW ARRIVAL | new-arrival | 🟢 Green |
| SALE | sale | 🔴 Red |
| TRENDING | trending | 🟠 Orange |
| LIMITED EDITION | limited-edition | 🟣 Purple |
| BEST SELLER | best-seller | 🔵 Blue |

3. **Assign tags to products:**
   - Edit product in admin
   - Select tags from dropdown (Ctrl+Click for multiple)
   - Save

4. **View on frontend:**
   - Badges appear on product cards automatically
   - Color-coded by tag slug
   - Stack vertically on product images

---

## 🔥 Enable Flash Sale

### Set Flash Sale on Product:

1. Visit: `http://localhost:8000/admin/products/product/`
2. Edit a product
3. Check **"Is flash sale"** checkbox
4. Set **"Flash sale price"** (e.g., 1200)
5. Set **"Flash sale ends at"** (future date/time)
6. Save

### Result:
- ⚡ **FLASH SALE** badge appears (red, animated)
- Product shows flash sale price
- Badge pulses to grab attention

---

## 🎨 Badge System Summary

### Badge Priority (Top to Bottom):

1. **⚡ FLASH SALE** (Highest)
   - Condition: `is_flash_active === true`
   - Color: Red (#DC2626)
   - Animation: Pulse

2. **X% OFF**
   - Condition: `discount_percentage > 0` AND no flash sale
   - Color: Blue (#5B6EF5)
   - Animation: None

3. **Product Tags** (Multiple allowed)
   - NEW ARRIVAL → Green
   - SALE → Red
   - TRENDING → Orange
   - LIMITED EDITION → Purple
   - Other → Blue

### Visual Example:

```
Product Card:
┌──────────────────────────┐
│ [⚡ FLASH SALE] 🔴 ✨    │  ← Animated
│ [NEW ARRIVAL] 🟢         │  ← Product tag
│ [TRENDING] 🟠            │  ← Product tag
│                          │
│    Product Image         │
│                      ❤️  │
└──────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: 500 Error on API

**Possible causes:**
1. Django server not running
2. Database connection issue
3. Missing migrations

**Solution:**
```bash
cd back-end
./venv/Scripts/activate
python manage.py migrate
python manage.py runserver
```

### Issue: Tags not showing

**Check:**
1. Product has tags assigned in admin
2. API returns tags in response: `curl http://localhost:8000/api/products/ | jq '.results[0].tags'`
3. Frontend using ProductCardV2 (not old ProductCard)

**Solution:**
```bash
# Test serializer
cd back-end
python test_serializer.py
```

### Issue: Badges not visible

**Check:**
1. Product has tags assigned
2. Tag slugs match color mapping
3. Browser cache cleared (Ctrl+Shift+R)

### Issue: Admin nested inline not working

**Check:**
1. `django-nested-admin` installed:
   ```bash
   pip show django-nested-admin
   ```
2. In `INSTALLED_APPS`:
   ```python
   INSTALLED_APPS = [
       # ...
       'nested_admin',
   ]
   ```
3. URLs configured:
   ```python
   path('_nested_admin/', include('nested_admin.urls')),
   ```

---

## 📁 Project Structure

```
luxe-market-project/
├── back-end/
│   ├── apps/
│   │   └── products/
│   │       ├── models.py          # Product, ColorVariant, SizeVariant, Tag
│   │       ├── serializers.py     # ProductListSerializerNew (with tags)
│   │       ├── views.py           # Updated to use new serializer
│   │       └── admin.py           # Nested inline admin
│   ├── config/
│   │   ├── settings/
│   │   └── urls.py                # nested_admin URLs
│   ├── requirements/
│   │   └── base.txt               # django-nested-admin
│   └── manage.py
│
├── front-end/
│   └── src/
│       ├── types/
│       │   └── product.ts         # ProductList with tags
│       └── components/
│           └── products/
│               └── ProductCardV2.tsx  # Badge display
│
└── Documentation/
    ├── INTEGRATION_COMPLETE.md       # Normalized structure guide
    ├── PRODUCT_TAGS_GUIDE.md          # Tags usage guide
    ├── TAGS_AND_BADGES_COMPLETE.md    # Badges implementation
    └── STARTUP_GUIDE.md               # This file
```

---

## ✅ Checklist

### Backend Setup:
- [ ] Virtual environment activated
- [ ] Dependencies installed (`pip install -r requirements/base.txt`)
- [ ] Migrations run (`python manage.py migrate`)
- [ ] Server running (`python manage.py runserver`)
- [ ] Admin accessible (`http://localhost:8000/admin/`)

### Frontend Setup:
- [ ] Dependencies installed (`npm install`)
- [ ] Server running (`npm run dev`)
- [ ] Site accessible (`http://localhost:3000/`)

### Tags Setup:
- [ ] Product tags created in admin
- [ ] Tags assigned to products
- [ ] Tags visible on API response
- [ ] Badges showing on frontend

### Testing:
- [ ] Serializer test passes (`python test_serializer.py`)
- [ ] Admin nested inline works
- [ ] Product cards show badges
- [ ] Flash sale badge animated
- [ ] Color selection changes image
- [ ] Size selection updates price

---

## 🎉 Success Criteria

You'll know everything is working when:

1. **Admin**: Can add product with colors and sizes on one page
2. **API**: Returns products with `tags` and `color_variants_new`
3. **Frontend**: Shows product cards with colored badges
4. **Flash Sale**: Badge pulses when active
5. **Colors**: Click color → image changes
6. **Sizes**: Click size → price updates
7. **Cart**: Add to cart with exact variant

---

## 📚 Documentation

- **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - Normalized structure overview
- **[PRODUCT_TAGS_GUIDE.md](PRODUCT_TAGS_GUIDE.md)** - How to use tags
- **[TAGS_AND_BADGES_COMPLETE.md](TAGS_AND_BADGES_COMPLETE.md)** - Badge system details
- **[NORMALIZATION_COMPARISON.md](NORMALIZATION_COMPARISON.md)** - Why normalized is better

---

## 🚀 Next Steps

1. **Start Backend:**
   ```bash
   cd back-end
   venv\Scripts\activate  # Windows
   python manage.py runserver
   ```

2. **Start Frontend:**
   ```bash
   cd front-end
   npm run dev
   ```

3. **Create Tags:**
   - Visit admin
   - Create NEW ARRIVAL, SALE, TRENDING tags
   - Assign to products

4. **Test Everything:**
   - Check product pages
   - Verify badges show
   - Test add to cart
   - Check color/size selection

---

**Ab sab kuch ready hai! Start both servers and enjoy your professional e-commerce platform!** 🎉

- ✅ Normalized product structure
- ✅ One-page admin entry
- ✅ Color-coded badges
- ✅ Animated flash sale
- ✅ Optimized API
- ✅ Beautiful UI

**Professional e-commerce platform ready for production!** 🚀
