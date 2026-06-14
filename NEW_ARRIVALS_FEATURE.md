# New Arrivals Feature - Complete Implementation

## Overview

The New Arrivals feature allows users to browse products tagged with "New Arrival" by clicking the "New Arrivals" link in the navbar. Products are filtered by their tag and displayed in a grid layout.

---

## Backend Implementation

### 1. Database Structure

**ProductTag Model** ([apps/products/models.py:18](back-end/apps/products/models.py#L18))
```python
class ProductTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)
```

**Product Model** - Tags relationship ([apps/products/models.py:103-107](back-end/apps/products/models.py#L103-L107))
```python
tags = models.ManyToManyField(
    ProductTag,
    blank=True,
    related_name="products"
)
```

### 2. API Endpoint

**Endpoint**: `GET /api/products/new-arrivals/`

**View Implementation** ([apps/products/views.py:131-148](back-end/apps/products/views.py#L131-L148))
```python
class NewArrivalsView(ListAPIView):
    serializer_class = ProductListSerializer
    pagination_class = None

    def get_queryset(self):
        # Filter products with "new-arrival" tag (case-insensitive slug match)
        return base_product_queryset().filter(
            tags__slug__iexact="new-arrival"
        ).distinct().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        cache_key = 'new_arrivals_list'
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset[:8], many=True)
        cache.set(cache_key, serializer.data, 60 * 10)  # Cache for 10 minutes
        return Response(serializer.data)
```

**Features**:
- Filters by `tags__slug__iexact="new-arrival"`
- Uses `.distinct()` to avoid duplicates
- Orders by `-created_at` (newest first)
- Returns maximum 8 products
- Cached for 10 minutes
- No authentication required

---

## Frontend Implementation

### 1. Navbar Link

**Component**: [front-end/src/components/layout/Navbar.tsx:49](front-end/src/components/layout/Navbar.tsx#L49)

```typescript
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Watches", href: "/category/watches" },
  { label: "Ladies Fashion", href: "/category/undergarments" },
  { label: "New Arrivals", href: "/new-arrivals" },  // ← New Arrivals link
  { label: "Sale", href: "/sale", accent: true },
];
```

### 2. New Arrivals Page

**Location**: [front-end/src/app/(shop)/new-arrivals/page.tsx](front-end/src/app/(shop)/new-arrivals/page.tsx)

**Key Features**:
- Fetches data using `getNewArrivals()` from productService
- Loading skeleton with animated placeholders
- Error handling with user-friendly messages
- Breadcrumb navigation
- Product count display
- Responsive grid layout using `ProductGrid` component

```typescript
export default function NewArrivalsPage() {
  const [data, setData] = useState<PaginatedResponse<ProductList> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getNewArrivals();
        setData(result);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load new arrivals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewArrivals();
  }, []);

  const products = data?.results ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'New Arrivals' },
      ]} />

      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-bold text-[#2C2416]">
          New Arrivals
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Discover our latest additions — fresh styles added just for you.
        </p>
        <p className="mt-1 text-sm text-[#A89880]">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
```

### 3. Product Service

**Location**: [front-end/src/services/productService.ts:38-40](front-end/src/services/productService.ts#L38-L40)

```typescript
export const getNewArrivals = async (page?: number): Promise<PaginatedResponse<ProductList>> => {
  const { data } = await api.get("/api/products/new-arrivals/", { params: { page } });
  return data;
};
```

Uses the typed `api.get<T>()` helper from [front-end/src/lib/api.ts](front-end/src/lib/api.ts) which:
- Automatically attaches auth tokens
- Handles 401 errors with silent token refresh
- Queues concurrent requests during refresh

### 4. Product Card Display

**Component**: [front-end/src/components/products/ProductCardV2.tsx:222-244](front-end/src/components/products/ProductCardV2.tsx#L222-L244)

**Tag Badge Display**:
```typescript
{product.tags && product.tags.length > 0 && (
  <>
    {product.tags.map((tag) => (
      <div
        key={tag.id}
        className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
        style={{
          backgroundColor: tag.slug === 'new-arrival'
            ? '#10B981' // Green for NEW ARRIVAL
            : tag.slug === 'sale'
            ? '#EF4444' // Red for SALE
            : tag.slug === 'trending'
            ? '#F59E0B' // Orange for TRENDING
            : tag.slug === 'limited-edition'
            ? '#8B5CF6' // Purple for LIMITED EDITION
            : BRAND_COLORS.accentBlue // Default blue
        }}
      >
        {tag.name}
      </div>
    ))}
  </>
)}
```

Products tagged with "new-arrival" display a **green badge** with the tag name.

---

## Data Seeding

### Management Command

**Command**: `python manage.py seed_products`

**Location**: [back-end/apps/products/management/commands/seed_products.py:15-17](back-end/apps/products/management/commands/seed_products.py#L15-L17)

Creates:
```python
new_arrival, _ = ProductTag.objects.get_or_create(
    name="New Arrival", 
    defaults={"slug": "new-arrival"}
)
```

Then assigns tags to products:
```python
product.tags.set([new_arrival])  # Single tag
product.tags.set([new_arrival, best_seller])  # Multiple tags
```

---

## User Flow

1. **User clicks "New Arrivals" in navbar**
   - Link at [front-end/src/components/layout/Navbar.tsx:49](front-end/src/components/layout/Navbar.tsx#L49)

2. **Router navigates to `/new-arrivals`**
   - Page component at [front-end/src/app/(shop)/new-arrivals/page.tsx](front-end/src/app/(shop)/new-arrivals/page.tsx)

3. **Page fetches products from API**
   - API call: `GET /api/products/new-arrivals/`
   - Service: [front-end/src/services/productService.ts:38](front-end/src/services/productService.ts#L38)

4. **Backend filters and returns products**
   - View: [back-end/apps/products/views.py:131](back-end/apps/products/views.py#L131)
   - Filter: `tags__slug__iexact="new-arrival"`
   - Limit: 8 products
   - Cache: 10 minutes

5. **Frontend displays products in grid**
   - Component: [front-end/src/components/products/ProductGrid.tsx](front-end/src/components/products/ProductGrid.tsx)
   - Card: [front-end/src/components/products/ProductCardV2.tsx](front-end/src/components/products/ProductCardV2.tsx)
   - Each product shows green "NEW ARRIVAL" badge

---

## Testing

### Backend Testing

```bash
# 1. Seed data
cd back-end
python manage.py seed_products

# 2. Test API endpoint
curl http://localhost:8000/api/products/new-arrivals/

# 3. Verify in Django shell
python manage.py shell
>>> from apps.products.models import Product, ProductTag
>>> tag = ProductTag.objects.get(slug="new-arrival")
>>> products = Product.objects.filter(tags=tag)
>>> print(f"Found {products.count()} products with 'new-arrival' tag")
```

### Frontend Testing

```bash
# 1. Start backend
cd back-end
python manage.py runserver

# 2. Start frontend (in new terminal)
cd front-end
npm run dev

# 3. Open browser
# Navigate to: http://localhost:3000/new-arrivals
```

**Expected Result**:
- ✅ Page loads without errors
- ✅ Shows breadcrumb: Home > New Arrivals
- ✅ Displays product count
- ✅ Shows products in responsive grid
- ✅ Each product has green "NEW ARRIVAL" badge
- ✅ Products are sorted newest first

### Manual Testing Checklist

- [ ] Click "New Arrivals" in navbar
- [ ] Page loads and displays header
- [ ] Products display in grid layout
- [ ] Green "NEW ARRIVAL" badge visible on products
- [ ] Product images load correctly
- [ ] Color/size variants work
- [ ] Add to cart functionality works
- [ ] Add to wishlist functionality works
- [ ] Click product navigates to detail page
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading skeleton displays while fetching
- [ ] Error message displays if API fails

---

## Adding "New Arrival" Tag to Products

### Via Django Admin

1. Go to `http://localhost:8000/admin/`
2. Navigate to **Products** → **Product Tags**
3. Verify "New Arrival" tag exists (slug: `new-arrival`)
4. Navigate to **Products** → **Products**
5. Edit any product
6. In the **Tags** field, select "New Arrival"
7. Click **Save**

### Via Django Shell

```python
python manage.py shell

from apps.products.models import Product, ProductTag

# Get the tag
tag = ProductTag.objects.get(slug="new-arrival")

# Add to a specific product
product = Product.objects.get(slug="your-product-slug")
product.tags.add(tag)

# Add to multiple products
products = Product.objects.filter(category__slug="watches")[:5]
for product in products:
    product.tags.add(tag)

# Remove tag from a product
product.tags.remove(tag)

# Clear cache after changes
from django.core.cache import cache
cache.delete('new_arrivals_list')
```

---

## Cache Management

**Cache Key**: `new_arrivals_list`
**Duration**: 10 minutes (600 seconds)

### Auto-Clear via Signals

The cache is automatically cleared when:
- A product is saved
- A product is deleted
- Product tags are modified

**Signal Handler**: [back-end/apps/products/signals.py:35](back-end/apps/products/signals.py#L35)

### Manual Cache Clear

```bash
# Clear all product caches
python manage.py clear_product_cache

# Or via Django shell
python manage.py shell
>>> from django.core.cache import cache
>>> cache.delete('new_arrivals_list')
```

---

## API Response Example

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Classic Gold Watch",
    "slug": "classic-gold-watch",
    "description": "Elegant Classic Gold Watch for the modern individual.",
    "base_price": "299.99",
    "sale_price": "249.99",
    "effective_price": "249.99",
    "discount_percentage": "16.67",
    "is_on_sale": true,
    "is_flash_sale": false,
    "flash_sale_price": null,
    "flash_sale_ends_at": null,
    "is_flash_active": false,
    "is_featured": false,
    "is_active": true,
    "primary_image": "https://iljvzwluibwuxyjavpwb.supabase.co/storage/v1/object/public/luxe-market/products/...",
    "tags": [
      {
        "id": "tag-uuid-here",
        "name": "New Arrival",
        "slug": "new-arrival"
      }
    ],
    "category_id": "category-uuid",
    "category_name": "Watches",
    "average_rating": 4.5,
    "review_count": 12,
    "is_in_stock": true,
    "color_variants_new": [
      {
        "id": "variant-uuid",
        "color_name": "Brown",
        "hex_primary": "#8B4513",
        "image_url": "https://...",
        "size_variants": [
          {
            "id": "size-uuid",
            "size_name": null,
            "sku": "WATCH-001-BRN",
            "stock_quantity": 10,
            "price_adjustment": "0.00",
            "is_in_stock": true,
            "final_price": "249.99"
          }
        ],
        "is_in_stock": true,
        "total_stock": 10
      }
    ]
  }
]
```

---

## File Reference

### Backend Files
- **Models**: [back-end/apps/products/models.py](back-end/apps/products/models.py)
- **Views**: [back-end/apps/products/views.py](back-end/apps/products/views.py)
- **Serializers**: [back-end/apps/products/serializers.py](back-end/apps/products/serializers.py)
- **URLs**: [back-end/apps/products/urls.py](back-end/apps/products/urls.py)
- **Seed Command**: [back-end/apps/products/management/commands/seed_products.py](back-end/apps/products/management/commands/seed_products.py)
- **Signals**: [back-end/apps/products/signals.py](back-end/apps/products/signals.py)

### Frontend Files
- **Page**: [front-end/src/app/(shop)/new-arrivals/page.tsx](front-end/src/app/(shop)/new-arrivals/page.tsx)
- **Service**: [front-end/src/services/productService.ts](front-end/src/services/productService.ts)
- **Navbar**: [front-end/src/components/layout/Navbar.tsx](front-end/src/components/layout/Navbar.tsx)
- **Product Grid**: [front-end/src/components/products/ProductGrid.tsx](front-end/src/components/products/ProductGrid.tsx)
- **Product Card**: [front-end/src/components/products/ProductCardV2.tsx](front-end/src/components/products/ProductCardV2.tsx)
- **Types**: [front-end/src/types/product.ts](front-end/src/types/product.ts)
- **API Client**: [front-end/src/lib/api.ts](front-end/src/lib/api.ts)

---

## Key Changes Made

### Backend
✅ Updated `NewArrivalsView.get_queryset()` to filter by `tags__slug__iexact="new-arrival"`
✅ Added `.distinct()` to prevent duplicate products
✅ Maintained `-created_at` ordering for newest first

### Frontend
✅ Existing page at `/new-arrivals` already functional
✅ ProductCardV2 already displays tag badges with proper styling
✅ Green badge (#10B981) for "new-arrival" tag
✅ API service already configured

### Documentation
✅ Created comprehensive feature documentation
✅ Added testing guide
✅ Documented data seeding process

---

## Future Enhancements

### Pagination
Currently returns max 8 products. To support more:
1. Enable pagination in backend view
2. Add pagination controls to frontend page
3. Update cache strategy per page

### Filtering & Sorting
Add filters to the page:
- By category
- By price range
- Sort by: newest, price, popularity

### Tag Management
- Allow users to filter by multiple tags
- Create a tags page showing all available tags
- Tag-based search functionality
