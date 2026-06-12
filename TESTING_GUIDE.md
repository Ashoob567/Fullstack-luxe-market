# Testing Guide: Featured Products Cache Fix

## Quick Start

### 1. Install New Dependencies

```bash
# Backend
cd back-end
pip install -r requirements/base.txt  # Installs requests>=2.31.0

# Frontend (no new deps needed)
cd front-end
npm install
```

### 2. Configure Environment Variables

**Backend `.env`:**
```bash
FRONTEND_URL=http://localhost:3000
NEXTJS_REVALIDATE_SECRET=dev-secret-change-in-production
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
REVALIDATE_SECRET=dev-secret-change-in-production
```

> **Important:** The `REVALIDATE_SECRET` must match `NEXTJS_REVALIDATE_SECRET` in backend!

### 3. Start Both Servers

```bash
# Terminal 1: Backend
cd back-end
python manage.py runserver

# Terminal 2: Frontend
cd front-end
npm run dev
```

---

## Test Scenarios

### ✅ Scenario 1: Remove Featured Product

**Steps:**
1. Open frontend: `http://localhost:3000`
2. Note the featured products showing (should see 8 products)
3. Open Django admin: `http://localhost:8000/admin/products/product/`
4. Find a product with `is_featured=True` ✓ checked
5. **Uncheck** the `is_featured` checkbox
6. Click **Save**

**Expected Result:**
- Backend console shows: `✓ Next.js cache revalidated for 'featured' tag`
- Refresh frontend **immediately** → product disappears from featured section
- OR wait up to **60 seconds** if revalidation API not configured

**If it fails:**
- Check Django console for signal print: `🔥 Signal fired for product: [name]`
- Check for errors: `⚠ Next.js revalidation failed: [error]`
- Verify env vars match between backend and frontend

---

### ✅ Scenario 2: Add New Featured Product

**Steps:**
1. In Django admin, find a product with `is_featured=False`
2. **Check** the `is_featured` checkbox
3. Click **Save**

**Expected Result:**
- Product appears in featured section on frontend within 60 seconds
- Or immediately if revalidation API working

---

### ✅ Scenario 3: Bulk Edit (List Editable)

**Steps:**
1. Go to Django admin product list
2. Toggle multiple `is_featured` checkboxes (check some, uncheck others)
3. Click **Save** button at bottom

**Expected Result:**
- Signal fires for each changed product
- All changes reflect on frontend within 60 seconds

---

### ✅ Scenario 4: Delete Product Entirely

**Steps:**
1. In Django admin, open a featured product
2. Click **Delete** at bottom
3. Confirm deletion

**Expected Result:**
- Product disappears from featured section
- No broken images or 404 errors
- Other products remain visible

---

### ✅ Scenario 5: Update Product Details

**Steps:**
1. Edit a featured product's:
   - Name
   - Price
   - Image
2. Save

**Expected Result:**
- Changes visible on frontend within 60 seconds

---

### ✅ Scenario 6: Manual Cache Clear

**Test the management command:**

```bash
cd back-end

# Clear Django cache only
python manage.py clear_product_cache

# Clear Django + trigger Next.js
python manage.py clear_product_cache --nextjs
```

**Expected Output:**
```
Clearing Django caches...
  ✓ Cleared: featured_products_list
  ✓ Cleared: new_arrivals_list
  ✓ Cleared: bestsellers_list

Triggering Next.js revalidation...
✓ Next.js cache revalidated for 'featured' tag

✓ All caches cleared!
```

---

## Debugging

### Check if signals are firing

Add this print statement to `back-end/apps/products/signals.py` line 81:

```python
@receiver([post_save, post_delete], sender=Product)
def clear_product_cache_on_change(sender, instance, **kwargs):
    print(f"🔥 Signal fired for: {instance.name}")  # ADD THIS LINE
    invalidate_product_caches()
```

**Then watch Django console when saving products.**

---

### Test Next.js Revalidation API Directly

```bash
curl -X POST "http://localhost:3000/api/revalidate?tag=featured&secret=dev-secret-change-in-production"
```

**Expected response:**
```json
{
  "revalidated": true,
  "tag": "featured",
  "now": 1234567890123
}
```

**If it fails:**
- Check `front-end/.env.local` has `REVALIDATE_SECRET`
- Check secret matches between backend and frontend
- Check frontend is running on port 3000

---

### Check Django Cache Status

```bash
# Django shell
cd back-end
python manage.py shell
```

```python
from django.core.cache import cache

# Check if featured products are cached
data = cache.get('featured_products_list')
print(data)  # Should be None after clearing, or list of products

# Manually clear
cache.delete('featured_products_list')
```

---

### Clear Everything (Nuclear Option)

```bash
# Backend: Clear Django cache
cd back-end
python manage.py clear_product_cache --nextjs

# Frontend: Delete build cache
cd front-end
rm -rf .next
npm run build
npm run dev

# Browser: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
```

---

## Success Criteria

- [x] Django signal fires when product saved (see console log)
- [x] Django cache clears immediately
- [x] Next.js revalidation API returns 200 (if configured)
- [x] Frontend shows changes within 60 seconds (or instantly)
- [x] No errors in Django console
- [x] No errors in Next.js console
- [x] Management command works without errors

---

## Common Issues

### Issue: "⚠ Next.js revalidation failed: Connection refused"

**Cause:** Frontend not running, or wrong `FRONTEND_URL`

**Fix:**
- Ensure frontend is running: `cd front-end && npm run dev`
- Check `FRONTEND_URL` in backend `.env` matches frontend port
- Verify: `curl http://localhost:3000/api/revalidate` returns something

---

### Issue: "Invalid secret"

**Cause:** Mismatched secrets between backend and frontend

**Fix:**
```bash
# Backend .env
NEXTJS_REVALIDATE_SECRET=my-secret-123

# Frontend .env.local
REVALIDATE_SECRET=my-secret-123
```

They must match exactly!

---

### Issue: Changes still not showing after 60 seconds

**Check:**
1. Is product still `is_active=True`? (inactive products don't show)
2. Is product still in database? (deleted products don't show)
3. Hard refresh browser (Ctrl+Shift+R)
4. Check Django cache: `cache.get('featured_products_list')`
5. Check Next.js cache: `rm -rf .next && npm run build`

---

### Issue: "ModuleNotFoundError: No module named 'requests'"

**Fix:**
```bash
cd back-end
pip install requests>=2.31.0
# OR
pip install -r requirements/base.txt
```

---

## Performance Monitoring

### Check cache hit rate:

**Before fix:**
- Featured products cached for 30 minutes
- ~2 requests per hour to backend

**After fix:**
- Featured products cached for 60 seconds
- ~60 requests per hour to backend (still very low)

**Impact:**
- Negligible - featured endpoint is fast (~50ms)
- Only 8 products returned
- DB query is optimized with select_related/prefetch_related

---

## Production Checklist

Before deploying to production:

- [ ] Change `REVALIDATE_SECRET` to strong random string
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Test signal firing in staging environment
- [ ] Monitor Django logs for revalidation failures
- [ ] Set up alerts for cache-related errors
- [ ] Document cache strategy in team wiki
- [ ] Train team on manual cache clearing command

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Django Admin / API                        │
│                                                              │
│  1. Admin saves Product                                      │
│     ↓                                                        │
│  2. post_save signal fires                                   │
│     ↓                                                        │
│  3. clear_product_cache_on_change()                          │
│     ├─→ cache.delete('featured_products_list')  [Django]    │
│     └─→ trigger_nextjs_revalidation()                        │
│           ↓                                                  │
│           POST /api/revalidate?tag=featured&secret=...       │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       ↓ HTTP Request
┌──────────────────────┼───────────────────────────────────────┐
│                 Next.js Frontend                             │
│                      ↓                                       │
│  4. /api/revalidate route receives request                   │
│     ↓                                                        │
│  5. Validates secret                                         │
│     ↓                                                        │
│  6. revalidateTag('featured')                                │
│     ├─→ Clears server-side cache                            │
│     └─→ Next request fetches fresh data                     │
│           ↓                                                  │
│  7. User visits homepage                                     │
│     ↓                                                        │
│  8. GET /api/products/featured/ (cache miss)                 │
│     ↓                                                        │
│  9. Fetch from Django backend                                │
│     ↓                                                        │
│ 10. Render with updated products ✓                           │
└─────────────────────────────────────────────────────────────┘
```

**Cache Layers:**
1. **Django Cache** (Redis/In-Memory) - 10 min TTL, cleared by signal
2. **Next.js Data Cache** - 60 sec TTL, cleared by revalidateTag()
3. **Browser Cache** - Standard HTTP cache headers

---

## Support

For issues or questions:
1. Check [CACHE_FIX.md](./CACHE_FIX.md) for detailed explanation
2. Review Django signal code: `back-end/apps/products/signals.py`
3. Review Next.js revalidation: `front-end/src/app/api/revalidate/route.ts`
4. Check environment variables in both `.env` files
5. Run management command: `python manage.py clear_product_cache --nextjs`
