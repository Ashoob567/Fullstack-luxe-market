# Testing New Arrivals Feature

## Backend Changes

### Updated `NewArrivalsView` in `apps/products/views.py`

The view now filters products by the "new-arrival" tag instead of just sorting by creation date:

```python
def get_queryset(self):
    # Filter products with "new-arrival" tag (case-insensitive slug match)
    return base_product_queryset().filter(
        tags__slug__iexact="new-arrival"
    ).distinct().order_by("-created_at")
```

## How to Test

### 1. Ensure you have seeded data with "new-arrival" tags

```bash
cd back-end
python manage.py seed_products
```

This creates:
- ProductTag with name="New Arrival" and slug="new-arrival"
- Several products tagged with this tag

### 2. Test the API endpoint

```bash
# Get all products with "new-arrival" tag
curl http://localhost:8000/api/products/new-arrivals/
```

Expected response: List of products that have the "new-arrival" tag (max 8 products)

### 3. Test the Frontend

1. Start the backend:
   ```bash
   cd back-end
   python manage.py runserver
   ```

2. Start the frontend:
   ```bash
   cd front-end
   npm run dev
   ```

3. Navigate to: http://localhost:3000/new-arrivals

4. Or click the "New Arrivals" link in the navbar

Expected behavior:
- Page displays all products with the "new-arrival" tag
- Products are sorted by newest first (created_at descending)
- Shows product count
- Displays in a responsive grid layout

## Adding the Tag to Products

### Via Django Admin

1. Go to http://localhost:8000/admin/
2. Navigate to Products → Product Tags
3. Find or create "New Arrival" tag with slug "new-arrival"
4. Navigate to Products → Products
5. Edit any product and add the "New Arrival" tag
6. Save

### Via Django Shell

```python
python manage.py shell

from apps.products.models import Product, ProductTag

# Get or create the tag
tag, _ = ProductTag.objects.get_or_create(
    slug="new-arrival",
    defaults={"name": "New Arrival"}
)

# Add tag to a product
product = Product.objects.first()
product.tags.add(tag)
product.save()

# Check products with the tag
Product.objects.filter(tags__slug="new-arrival").count()
```

## API Response Structure

The endpoint returns a list of products (not paginated):

```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "slug": "product-slug",
    "base_price": "299.99",
    "sale_price": "249.99",
    "effective_price": "249.99",
    "primary_image": "https://...",
    "tags": [
      {
        "id": "uuid",
        "name": "New Arrival",
        "slug": "new-arrival"
      }
    ],
    "category_name": "Category",
    "is_in_stock": true,
    "average_rating": 4.5,
    "review_count": 10
  }
]
```

## Cache Behavior

- Results are cached for 10 minutes with key `new_arrivals_list`
- Cache is automatically cleared when products are saved/deleted via signals
- Manual clear: `python manage.py clear_product_cache`
