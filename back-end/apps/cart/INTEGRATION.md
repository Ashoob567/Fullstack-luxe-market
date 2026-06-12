# Cart Integration Guide

## Integrating Stock Reservation with Checkout

The cart app now includes stock reservation to prevent overselling during checkout. Here's how to integrate it with your payments/checkout flow.

### Current Flow (in `apps/payments/views.py`)

```python
def post(self, request):
    # 1. Fetch cart
    cart = _get_cart(request.user.id)
    
    # 2. Validate & calculate totals
    totals = _calculate_totals(cart)
    
    # 3. Create order & reduce stock
    order = _create_order_and_items(...)
    
    # 4. Clear cart
    _clear_cart(request.user.id)
```

### Recommended Flow (with Stock Reservation)

```python
from apps.cart.services import CartService

def post(self, request):
    cart_key = f"cart:{request.user.id}"
    
    # 1. Fetch cart
    cart = CartService.get_cart(cart_key)
    
    # 2. Reserve stock (prevents race conditions)
    try:
        reservation = CartService.reserve_stock(cart_key, minutes=15)
    except ValueError as e:
        return Response(
            {"detail": str(e)},  # "Insufficient stock for..."
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 3. Validate & calculate totals
    totals = _calculate_totals(cart)
    
    # 4. Process payment
    if payment_method == "mock_card":
        # ... payment logic
        pass
    
    # 5. Create order & reduce stock
    try:
        order = _create_order_and_items(
            user=request.user,
            cart=cart,
            totals=totals,
            # ... other params
        )
    except Exception as exc:
        # Release reservation on failure
        CartService.release_reservation(cart_key)
        logger.exception("Order creation failed: %s", exc)
        return Response(
            {"detail": "Order failed. Your cart has been preserved."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # 6. Clear cart & release reservation
    CartService.clear_cart(cart_key)
    CartService.release_reservation(cart_key)  # Manual cleanup
    
    return Response({...})
```

### Key Changes

1. **Reserve before payment** — Call `reserve_stock()` early to lock inventory
2. **Handle reservation errors** — Return clear error if stock unavailable
3. **Release on failure** — Always release if order creation fails
4. **Manual cleanup** — Release after successful order (or let TTL expire)

### Benefits

- ✅ **Prevents overselling** — Stock locked during checkout
- ✅ **Race condition protection** — Multiple users can't grab same last item
- ✅ **Graceful degradation** — Reservation expires if user abandons
- ✅ **Clear error messages** — Users know immediately if stock unavailable

### Edge Cases

#### User Abandons Checkout
- **Reservation auto-expires** after 15 minutes
- Stock becomes available again automatically

#### Payment Takes Long Time
- **Default 15 min** should be enough for card processing
- Increase to 30 min for slower gateways: `reserve_stock(cart_key, minutes=30)`

#### Order Creation Fails
- **Always release** in except block
- Cart preserved — user can retry

#### User Refreshes Checkout Page
- **Check existing reservation**: `CartService.get_reservation_status(cart_key)`
- Extend TTL if needed or create new reservation

### Example: Checking Reservation Status

```python
# On checkout page load
cart_key = f"cart:{request.user.id}"
status = CartService.get_reservation_status(cart_key)

if status:
    # Reservation exists
    time_left = status['ttl_seconds']
    if time_left < 300:  # Less than 5 minutes
        # Optionally extend or warn user
        CartService.reserve_stock(cart_key, minutes=15)  # Extends TTL
else:
    # No reservation — create one
    CartService.reserve_stock(cart_key, minutes=15)
```

### Migration Path

**Phase 1: Test in Development**
- Add reservation calls to payments view
- Test with multiple concurrent checkouts
- Verify stock numbers stay correct

**Phase 2: Gradual Rollout**
- Deploy behind feature flag
- Monitor Redis reservation keys
- Check for abandoned reservations

**Phase 3: Production**
- Enable for all users
- Set up alerts for high reservation counts
- Monitor stock accuracy improvements

### Monitoring

Check active reservations:
```bash
python manage.py list_active_carts --pattern "cart:*:reservation"
```

Release stuck reservations (if needed):
```python
from apps.cart.services import CartService
CartService.release_reservation("cart:123")
```

### Performance Impact

- **Redis overhead:** +2 ops per checkout (set, delete)
- **Memory:** ~500 bytes per reservation
- **Latency:** <5ms for reservation operations

Negligible for most workloads. Redis can handle 100K+ reservations/sec.

---

## Alternative: Optimistic Locking

If you prefer not to use reservations, use optimistic locking in `_create_order_and_items`:

```python
with transaction.atomic():
    for item in cart["items"]:
        variant = ProductVariant.objects.select_for_update().get(pk=item["variant_id"])
        
        # Check stock again at write time
        if variant.stock_qty < item["quantity"]:
            raise ValueError(f"Insufficient stock for {variant.product.name}")
        
        variant.stock_qty -= item["quantity"]
        variant.save()
```

**Trade-offs:**
- ✅ Simpler (no Redis reservation logic)
- ❌ User finds out stock unavailable after payment processing
- ❌ Higher transaction rollback rate
- ❌ Race conditions still possible (though rare with `select_for_update`)

Reservations provide better UX and lower failure rates.
