# Guest Wishlist Feature - Implementation Summary

## Overview
Extended the wishlist feature to support **guest users (non-authenticated)** using localStorage as a fallback storage mechanism.

## Changes Made

### 1. Updated Types (`front-end/src/types/wishlist.ts`)
Added `GuestWishlistItem` interface:
```typescript
export interface GuestWishlistItem {
  id: string;        // Product UUID
  name: string;
  price: string;
  image: string;
  slug: string;
  category: string;
}
```

### 2. Enhanced Wishlist Store (`front-end/src/hooks/useWishlistStore.ts`)
**New Features:**
- Dual-mode operation (guest vs authenticated)
- Guest state: `guestItems: GuestWishlistItem[]`
- localStorage key: `"wishlist"`
- Max items: 20 (configurable via `MAX_GUEST_ITEMS`)

**New Methods:**
- `initializeGuestWishlist()` - Loads from localStorage
- `getGuestItems()` - Returns guest wishlist items

**Updated Method:**
- `toggleWishlist(productId, productData?)` - Now accepts optional product data for guest mode

**Logic:**
```
if (isAuthenticated) {
  → Use backend API
  → Store only product IDs
} else {
  → Use localStorage
  → Store full product objects
  → Enforce 20-item limit
}
```

### 3. Updated WishlistInitializer (`front-end/src/components/common/WishlistInitializer.tsx`)
- Checks authentication state
- Loads from backend (authenticated) OR localStorage (guest)
- Handles login/logout transitions

### 4. Updated ProductCard (`front-end/src/components/products/ProductCard.tsx`)
Now passes product data to `toggleWishlist()`:
```typescript
await toggleWishlistStore(product.id, {
  name: product.name,
  price: String(displayPrice),
  image: imageUrl,
  slug: product.slug,
  category: categoryLabel,
});
```

### 5. Updated ProductDetailClient (`front-end/src/components/products/Productdetailclient.tsx`)
Same change - passes product data for guest wishlist storage.

### 6. Redesigned Wishlist Page (`front-end/src/app/account/wishlist/page.tsx`)
**Two Rendering Modes:**

**Authenticated:**
- Fetches from backend via `getWishlist()`
- Renders full `ProductCard` components

**Guest:**
- Reads from `useWishlistStore().getGuestItems()`
- Renders simplified `GuestWishlistCard` components
- Shows banner: "Login to sync your wishlist across devices"

## Behavior Comparison

| Feature | Guest Mode | Authenticated Mode |
|---------|-----------|-------------------|
| Storage | localStorage | PostgreSQL (backend) |
| Max Items | 20 items | Unlimited |
| Data Stored | Full product objects | Product IDs only |
| Persistence | Browser-local | Synced across devices |
| Network Calls | None | API sync on every toggle |
| Page Refresh | Instant load | Requires API call |
| Cross-Device | ❌ No | ✅ Yes |

## User Experience

### Guest User Flow
1. Browse products without logging in
2. Click heart → Item saved to localStorage instantly
3. Toast: "Added '{Product Name}' to wishlist"
4. Visit `/account/wishlist` → See saved items
5. Banner suggests logging in to sync
6. After 20 items → "Wishlist is full" message

### Login Transition
1. User logs in
2. WishlistInitializer detects auth change
3. Switches to backend mode
4. Guest items remain in localStorage (not auto-merged)
5. Backend wishlist loads and displays

### Logout Transition
1. User logs out
2. WishlistInitializer detects auth change
3. Switches back to localStorage mode
4. Guest items from before still available

## localStorage Structure

**Key:** `"wishlist"`

**Value (JSON Array):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Luxury Watch Collection",
    "price": "2999.00",
    "image": "https://iljvzwluibwuxyjavpwb.supabase.co/storage/v1/object/public/luxe-market-media/products/watch.jpg",
    "slug": "luxury-watch-collection",
    "category": "Watches"
  }
]
```

**Size Estimate:**
- ~250 bytes per item
- 20 items ≈ 5KB total
- Well within localStorage limits (5-10MB)

## Why This Approach?

### ✅ Advantages
1. **No Friction** - Users can wishlist without account creation
2. **Instant Feedback** - No network latency for guest users
3. **Offline Support** - Works without internet connection
4. **Low Backend Load** - Reduces unnecessary API calls
5. **Conversion Funnel** - Encourages signup to unlock sync

### ⚠️ Trade-offs
1. **Not Synced** - Guest wishlist is device-specific
2. **20 Item Limit** - Prevents localStorage bloat
3. **No Analytics** - Can't track guest wishlist behavior on backend
4. **Data Duplication** - Product info stored redundantly

## Future Enhancements

### 1. **Auto-Merge on Login** (Recommended)
When user logs in, automatically merge guest localStorage items into backend:
```typescript
const guestItems = loadGuestWishlist();
if (guestItems.length > 0 && isAuthenticated) {
  // POST each guest item to backend
  // Clear localStorage after successful merge
}
```

### 2. **Stale Data Detection**
Check if prices/images in localStorage are outdated:
```typescript
if (item.lastUpdated < Date.now() - 7 * 24 * 60 * 60 * 1000) {
  // Refresh from API
}
```

### 3. **Bulk Add to Cart**
Add "Add All to Cart" button on wishlist page.

### 4. **Export/Import**
Allow users to export wishlist as JSON and import on another device.

## Middleware Configuration

The `/account/wishlist` route is **public** and accessible to guest users without authentication. This is configured in `front-end/src/middleware.ts`:

```typescript
const publicAccountRoutes = ['/account/wishlist']; // Guest-accessible routes
```

All other `/account/*` routes require authentication, but wishlist is explicitly excluded to allow guest users to view their localStorage-based wishlist.

## Testing

### Manual Testing Steps

**Guest Mode:**
1. Open app in incognito/private window (no login)
2. Click heart on 3 different products
3. Check localStorage: `localStorage.getItem('wishlist')`
4. Refresh page → Hearts should still be filled
5. Visit `/account/wishlist` → **Should see 3 items WITHOUT login prompt**
6. Add 18 more items (total 21) → Should see "full" message
7. Remove one item → Heart unfills
8. Close browser, reopen → Items should persist

**Authenticated Mode:**
1. Login with test account
2. Click heart on 2 products
3. Check Network tab → Should see POST to `/api/wishlist/toggle/`
4. Refresh page → Items should reload from backend
5. Logout → Switch back to guest mode

**Mode Transitions:**
1. Guest: Add 5 items
2. Login → Guest items stay in localStorage
3. Add 2 more items (backend)
4. Logout → Should see original 5 guest items
5. Login again → Should see 2 backend items

## Files Modified/Created

```
front-end/src/
├── middleware.ts                                (Added publicAccountRoutes for /account/wishlist)
├── types/wishlist.ts                           (Added GuestWishlistItem)
├── hooks/useWishlistStore.ts                   (Dual-mode logic)
├── components/
│   ├── common/WishlistInitializer.tsx          (Handles mode switching)
│   ├── layout/Navbar.tsx                        (Shows wishlist count badge)
│   └── products/
│       ├── ProductCard.tsx                      (Passes product data)
│       └── Productdetailclient.tsx              (Passes product data)
├── app/account/wishlist/page.tsx               (Guest + Auth rendering)
└── GUEST_WISHLIST_FEATURE.md                  (This file)
```

## Configuration

To change the guest item limit, edit `front-end/src/hooks/useWishlistStore.ts`:
```typescript
const MAX_GUEST_ITEMS = 20; // Change this value
```

To change the localStorage key:
```typescript
const GUEST_WISHLIST_KEY = 'wishlist'; // Change this value
```

## Notes

- Guest wishlist is intentionally NOT merged on login to avoid unexpected backend writes
- Consider adding an "Import Guest Wishlist" prompt after login
- 20-item limit balances functionality with localStorage size
- Each product object is ~250 bytes (conservative estimate)
- No expiration implemented - items persist indefinitely in localStorage
