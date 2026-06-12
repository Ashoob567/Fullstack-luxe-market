# Cart App Documentation

## Overview

The **cart** app provides a Redis-backed shopping cart system for Luxe Market. Unlike traditional Django apps that use database models, this cart stores all data in Redis for fast, session-based access.

### Key Features

- ✅ **Redis-based storage** — Fast, temporary cart data
- ✅ **Guest & authenticated users** — Seamless cart experience for both
- ✅ **Cart merging** — Guest cart transfers to user cart on login
- ✅ **Coupon system** — Apply and validate discount codes
- ✅ **Stock validation** — Real-time stock checks and reservation
- ✅ **Auto-expiry** — Guest carts expire after 24h, user carts after 7 days
- ✅ **Stock reservation** — 15-minute hold during checkout

---

## Architecture

### Storage Model

**No Django Models** — The [models.py](models.py) file is intentionally empty. All cart data lives in Redis.

### Redis Key Structure

| Key Pattern | Description | TTL |
|-------------|-------------|-----|
| `cart:{user_id}` | Authenticated user cart | 7 days |
| `cart:guest:{session_key}` | Guest cart | 24 hours |
| `cart:{*}:reservation` | Stock reservation during checkout | 15 minutes |

### Cart Data Schema

```json
{
  "items": [
    {
      "cart_item_id": "uuid",
      "product_id": "uuid",
      "variant_id": "uuid",
      "name": "Product Name",
      "image": "https://...",
      "price": "1500.00",
      "quantity": 2,
      "size": "M",
      "color": "Black"
    }
  ],
  "coupon_code": "LUXE10",
  "discount_amount": "150.00"
}
```

---

## API Endpoints

All endpoints are mounted at `/api/cart/`

### 1. Get Cart
```http
GET /api/cart/
```
Returns the current user's or guest's cart.

**Response:**
```json
{
  "items": [...],
  "coupon_code": null,
  "discount_amount": 0,
  "summary": {
    "subtotal": 3000.00,
    "discount_amount": 0,
    "shipping": 200.00,
    "total": 3200.00
  }
}
```

### 2. Add Item
```http
POST /api/cart/add/
Content-Type: application/json

{
  "product_id": "uuid",
  "variant_id": "uuid",
  "quantity": 2
}
```

**Validation:**
- Product and variant must exist and be active
- Stock must be available
- Quantity must be ≥ 1

### 3. Update Item Quantity
```http
PUT /api/cart/update/{cart_item_id}/
Content-Type: application/json

{
  "quantity": 3
}
```

### 4. Remove Item
```http
DELETE /api/cart/remove/{cart_item_id}/
```

### 5. Clear Cart
```http
DELETE /api/cart/clear/
```

### 6. Apply Coupon
```http
POST /api/cart/coupon/
Content-Type: application/json

{
  "coupon_code": "LUXE10"
}
```

**Validation:**
- Coupon must exist and be active
- Must not be expired or fully redeemed
- Cart subtotal must meet minimum order amount

### 7. Remove Coupon
```http
DELETE /api/cart/coupon/remove/
```

### 8. Merge Guest Cart (Login)
```http
POST /api/cart/merge/
Authorization: Bearer {jwt_token}

{
  "guest_key": "cart:guest:{session_key}"  // optional
}
```

**Authentication:** Required (user must be logged in)

**Behavior:**
- Merges guest cart items into user cart
- Duplicates (same variant) have quantities summed
- Guest cart is deleted after merge
- Guest coupon carried over if user has none

---

## CartService Methods

All business logic lives in [services.py](services.py)

### Core Operations

#### `get_cart(cart_key: str) -> dict`
Fetch cart from Redis. Returns empty cart if not found.

#### `add_item(cart_key, product_id, variant_id, quantity) -> dict`
Add or increment item quantity. Validates stock availability.

#### `update_item(cart_key, cart_item_id, quantity) -> dict`
Change quantity of existing item. Re-validates stock.

#### `remove_item(cart_key, cart_item_id) -> dict`
Delete single line item.

#### `clear_cart(cart_key: str) -> bool`
Delete entire cart from Redis.

### Coupon Operations

#### `apply_coupon(cart_key, coupon_code) -> dict`
Validate and apply discount coupon.

**Raises:** `ValueError` if invalid, expired, or cart below minimum.

#### `remove_coupon(cart_key: str) -> dict`
Remove applied coupon and reset discount.

### Stock Reservation (New!)

#### `reserve_stock(cart_key: str, minutes: int = 15) -> dict`
Reserve stock during checkout to prevent overselling.

**Returns:**
```python
{
  "reservation_key": "cart:123:reservation",
  "expires_in_seconds": 900,
  "reserved_items": [
    {"product_id": "...", "variant_id": "...", "quantity": 2}
  ]
}
```

**Raises:** `ValueError` if insufficient stock available.

#### `release_reservation(cart_key: str) -> bool`
Release reservation before TTL expires.

Use when:
- User abandons checkout
- Order creation fails
- User explicitly cancels

#### `get_reservation_status(cart_key: str) -> dict | None`
Check if reservation exists and time remaining.

---

## Checkout Integration

The cart integrates with the orders/payments flow in [apps/payments/views.py](../payments/views.py:252-258)

### Checkout Flow

1. **User initiates checkout** → `POST /api/payments/create-intent/`
2. **Fetch cart from Redis** → `_get_cart(user_id)`
3. **Reserve stock** → `CartService.reserve_stock(cart_key)` *(recommended)*
4. **Validate cart** → Check items, calculate totals
5. **Process payment** → Mock card or COD
6. **Create order** → `_create_order_and_items()`
   - Reduces `ProductVariant.stock_qty` in database
   - Creates `Order` and `OrderItem` records
7. **Clear cart** → `_clear_cart(user_id)`
8. **Release reservation** → Auto-expires or manual release

### Stock Flow

```
Cart Add → Check Available Stock → Allow/Deny
Checkout → Reserve Stock (15 min) → Deduct from Available
Order Created → Reduce DB Stock → Release Reservation
```

---

## Management Commands

### List Active Carts

```bash
# Basic list
python manage.py list_active_carts

# Show full details
python manage.py list_active_carts --details

# Filter by user
python manage.py list_active_carts --user-id 123

# Custom pattern
python manage.py list_active_carts --pattern "cart:guest:*"
```

**Output:**
```
🔍 Scanning Redis for pattern: cart:*

Found 5 active cart(s)
Found 2 active reservation(s)

[1] cart:42
    Type: User
    Identifier: user@example.com (ID: 42)
    Items: 3 (Total qty: 5)
    Coupon: LUXE10
    TTL: 604800s (10080 min)

[2] cart:guest:abc123...
    Type: Guest
    Identifier: abc123...
    Items: 1 (Total qty: 2)
    TTL: 82800s (1380 min)
```

### Clear Expired Carts

```bash
# Dry run (preview only)
python manage.py clear_expired_carts --dry-run

# Clear all guest carts
python manage.py clear_expired_carts --pattern "cart:guest:*"

# Clear carts expiring in < 1 hour
python manage.py clear_expired_carts --ttl-below 3600

# Force without confirmation
python manage.py clear_expired_carts --force
```

---

## Configuration

### Environment Variables

Required in `.env`:

```bash
REDIS_URL=rediss://default:password@host:6379
```

### Settings

Configured in [config/settings/base.py](../../config/settings/base.py:149-162):

```python
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
```

### Constants

Adjust in [services.py](services.py:50-54):

```python
USER_CART_TTL = 7 * 24 * 60 * 60        # 7 days
GUEST_CART_TTL = 24 * 60 * 60           # 24 hours
STOCK_RESERVATION_TTL = 15 * 60         # 15 minutes

FREE_SHIPPING_THRESHOLD = Decimal("3000.00")  # PKR
SHIPPING_COST = Decimal("200.00")             # PKR
```

---

## Testing

Comprehensive test suite in [tests/test_cart.py](tests/test_cart.py)

### Running Tests

```bash
# All cart tests
pytest apps/cart/tests/

# With coverage
pytest apps/cart/tests/ --cov=apps.cart

# Specific test
pytest apps/cart/tests/test_cart.py::TestAddItem::test_add_item_to_cart
```

### Test Setup

Uses **fakeredis** to mock Redis without external dependencies:

```bash
pip install fakeredis
```

Tests cover:
- ✅ Add/update/remove items
- ✅ Clear cart
- ✅ Apply/remove coupons
- ✅ Coupon validation (expired, below minimum)
- ✅ Stock validation
- ✅ Cart merging

---

## Admin Interface

**Not Available** — Since carts are stored in Redis (not the database), Django admin cannot display them.

### Alternatives

1. **Management commands** — Use `list_active_carts` (see above)
2. **Redis CLI** — Direct inspection:
   ```bash
   redis-cli -u $REDIS_URL
   KEYS cart:*
   GET cart:123
   TTL cart:123
   ```
3. **Custom admin view** — Build a Django admin page that reads from Redis

---

## Common Tasks

### Debugging a User's Cart

```bash
# List specific user's cart
python manage.py list_active_carts --user-id 123 --details

# Or via Redis CLI
redis-cli -u $REDIS_URL GET cart:123
```

### Clearing Test Carts

```bash
# Clear all carts (careful!)
python manage.py clear_expired_carts --pattern "cart:*" --force

# Clear only guest carts
python manage.py clear_expired_carts --pattern "cart:guest:*" --force
```

### Inspecting Reservations

```python
from apps.cart.services import CartService

status = CartService.get_reservation_status("cart:123")
if status:
    print(f"Expires in {status['ttl_seconds']}s")
    print(f"Reserved items: {status['reserved_items']}")
```

### Manually Releasing a Reservation

```python
from apps.cart.services import CartService

released = CartService.release_reservation("cart:123")
print(f"Reservation released: {released}")
```

---

## Performance Considerations

### Redis Memory Usage

Each cart is ~1-5 KB depending on item count. With 10,000 active carts:
- **Storage:** ~10-50 MB
- **Ops/sec:** Redis can handle 100K+ ops/sec

### TTL Strategy

- **User carts (7 days):** Balance between convenience and stale data
- **Guest carts (24h):** Short enough to avoid clutter
- **Reservations (15 min):** Prevent abandoned checkouts from blocking stock

### Scaling

For high traffic:
1. **Redis Cluster** — Shard cart keys across nodes
2. **Read replicas** — For `GET /api/cart/` requests
3. **Connection pooling** — Reuse connections (already configured via `django-redis`)

---

## Known Limitations

1. **No cart history** — Once cleared, cart data is gone (by design)
2. **No cross-device sync for guests** — Guest carts tied to session
3. **Stock race conditions** — Small window between add and checkout (mitigated by reservations)
4. **No partial reservations** — If any item lacks stock, entire reservation fails

---

## Future Enhancements

- [ ] **Cart analytics** — Track abandonment rates, popular items
- [ ] **Bulk operations** — Add multiple items at once (e.g., from wishlist)
- [ ] **Cart expiry notifications** — Email users before cart expires
- [ ] **Persistent guest carts** — Store guest carts by email/device ID
- [ ] **Redis pub/sub** — Real-time cart updates for concurrent sessions
- [ ] **Stock allocation API** — Soft-reserve on add, hard-reserve on checkout

---

## Troubleshooting

### "Module redis not found"

```bash
pip install redis>=5.0 django-redis>=5.4
```

### "Cart is empty" during checkout

- Check Redis connection: `redis-cli -u $REDIS_URL PING`
- Verify cart key exists: `redis-cli -u $REDIS_URL KEYS "cart:*"`
- Ensure session middleware is enabled

### "Insufficient stock" error

- Run `python manage.py list_active_carts --details` to see reservations
- Check `ProductVariant.stock_qty` in database
- Release stuck reservations: `CartService.release_reservation(cart_key)`

### Carts not expiring

- Verify Redis TTL: `redis-cli -u $REDIS_URL TTL cart:123`
- Check Redis eviction policy (should be `volatile-ttl` or `allkeys-lru`)

---

## Related Apps

- **[products](../products/)** — Product and variant models
- **[coupons](../coupons/)** — Coupon validation logic
- **[orders](../orders/)** — Order creation from cart
- **[payments](../payments/)** — Checkout flow integration

---

## Contact & Support

For issues or questions:
- Check [CLAUDE.md](../../CLAUDE.md) for project setup
- Review test cases for usage examples
- Use management commands for debugging

**Last Updated:** 2026-06-05
