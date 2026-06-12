# Cart Architecture - Frontend

## Overview

Complete, production-ready cart system with:
- ✅ **Optimistic updates** for instant UI feedback
- ✅ **Backend sync** with Django Redis cart API
- ✅ **Loading states** on all cart actions
- ✅ **Error handling** with user-friendly toast notifications
- ✅ **Rollback mechanism** when backend operations fail
- ✅ **Guest & authenticated** user support
- ✅ **localStorage persistence** for offline support
- ✅ **Type-safe** with full TypeScript coverage

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action                             │
│              (Click "Add to Cart")                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              AddToCartButton Component                       │
│  • Shows loading spinner during request                     │
│  • Shows checkmark on success                               │
│  • Calls cartStore.addItem()                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cart Store (Zustand)                        │
│  1. Optimistic Update → Update UI immediately               │
│  2. Save to localStorage                                    │
│  3. Backend Sync → POST /api/cart/add/                     │
│     • On success: Replace with backend data                 │
│     • On failure: Rollback to previous state               │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│  localStorage│    │  Django Backend   │
│   (Primary)  │    │   (Redis Cart)    │
└──────────────┘    └──────────────────┘
```

---

## File Structure

```
front-end/src/
├── services/
│   └── cart.service.ts          # API service layer
├── store/
│   └── cartStore.ts              # Zustand store with optimistic updates
├── hooks/
│   ├── useCart.ts                # Cart hook (existing)
│   └── useToast.tsx              # Toast notifications
├── providers/
│   └── CartProvider.tsx          # App-level cart initialization
├── components/
│   ├── cart/
│   │   ├── AddToCartButton.tsx   # Reusable add-to-cart button
│   │   ├── CartItem.tsx          # Updated with loading states
│   │   ├── CartDrawer.tsx        # Existing drawer
│   │   └── CartSummary.tsx       # Existing summary
│   └── common/
│       └── ToastContainer.tsx    # Toast UI component
└── types/
    └── cart.ts                   # Cart type definitions
```

---

## Core Components

### 1. Cart Service (`cart.service.ts`)

Type-safe API layer for all cart operations.

```typescript
import { cartService } from '@/services/cart.service';

// Add item
await cartService.addToCart({
  product_id: 'uuid',
  variant_id: 'uuid',
  quantity: 2
});

// Update quantity
await cartService.updateCartItem(cartItemId, 3);

// Remove item
await cartService.removeCartItem(cartItemId);

// Clear cart
await cartService.clearCart();
```

**Features:**
- Uses typed `get`, `post`, `put`, `del` helpers from `@/lib/api`
- Automatic token refresh on 401
- Consistent error format

---

### 2. Cart Store (`cartStore.ts`)

Zustand store with **optimistic updates** and **rollback**.

```typescript
const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  isSyncing: false,
  lastError: null,

  addItem: async (item) => {
    // 1. Optimistic update
    const optimisticItems = [...state.items, item];
    set({ items: optimisticItems });
    saveToLocalStorage(optimisticItems);

    // 2. Backend sync
    if (isAuthenticated()) {
      try {
        const response = await cartService.addToCart(item);
        set({ items: transformBackendToCartItems(response) });
      } catch (error) {
        // 3. Rollback on failure
        set({ items: previousItems });
        throw error;
      }
    }
  },
  // ... other actions
}));
```

**Key Features:**
- **Optimistic updates**: UI updates instantly before backend confirms
- **Rollback**: Reverts to previous state if backend fails
- **localStorage persistence**: Cart survives page refreshes
- **Guest mode**: Works without authentication (localStorage only)
- **Authenticated mode**: Syncs with backend Redis cart

---

### 3. AddToCartButton Component

Reusable button with loading states and error handling.

```tsx
<AddToCartButton
  item={{
    variant_id: variant.id,
    product_id: product.id,
    name: product.name,
    image: product.image,
    price: "1500.00",
    quantity: 2,
    size: "M",
    color: "Black"
  }}
  disabled={!inStock}
  size="lg"
  fullWidth
  label="Add to Cart"
  onSuccess={() => console.log('Item added!')}
/>
```

**States:**
1. **Default**: Shows "Add to Cart" with cart icon
2. **Loading**: Shows spinner + "Adding..."
3. **Success**: Shows checkmark + "Added!" (2 seconds)
4. **Error**: Shows toast notification

---

### 4. Toast Notifications

User feedback system for all cart operations.

```typescript
import { useToast } from '@/hooks/useToast';

const { success, error, info, warning } = useToast();

success('Item added to cart!', 3000);
error('Failed to remove item', 4000);
```

**Toast Types:**
- ✅ `success`: Green background, checkmark icon
- ❌ `error`: Red background, X icon
- ℹ️ `info`: Blue background, info icon
- ⚠️ `warning`: Orange background, warning icon

---

### 5. CartProvider

Initializes cart from backend on app load.

```tsx
// Automatically included in root layout
<CartProvider>
  {children}
</CartProvider>
```

**Responsibilities:**
- Syncs cart with backend on initial load (authenticated users)
- Listens for login/logout events
- Merges guest cart with user cart on login

---

## Usage Examples

### Example 1: Product Detail Page

```tsx
'use client';

import { useState } from 'react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export function ProductDetailClient({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);

  const cartItemData = {
    variant_id: selectedVariant.id,
    product_id: product.id,
    name: product.name,
    image: product.primary_image,
    price: selectedVariant.final_price,
    quantity,
    size: selectedVariant.size,
    color: selectedVariant.color,
  };

  return (
    <div>
      {/* Variant selector */}
      <ProductVariantSelector
        product={product}
        onVariantSelect={setSelectedVariant}
      />

      {/* Quantity selector */}
      <QuantitySelector
        quantity={quantity}
        onIncrease={() => setQuantity(q => q + 1)}
        onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
      />

      {/* Add to cart button */}
      <AddToCartButton
        item={cartItemData}
        disabled={!selectedVariant.is_in_stock}
        size="lg"
        fullWidth
      />
    </div>
  );
}
```

---

### Example 2: Product Card (Quick Add)

```tsx
'use client';

import { AddToCartButton } from '@/components/cart/AddToCartButton';

export function ProductCard({ product }) {
  const defaultVariant = product.variants[0];

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{formatPrice(product.price)}</p>

      <AddToCartButton
        item={{
          variant_id: defaultVariant.id,
          product_id: product.id,
          name: product.name,
          image: product.image,
          price: defaultVariant.final_price,
          quantity: 1,
          size: defaultVariant.size,
          color: defaultVariant.color,
        }}
        size="sm"
        variant="outline"
      />
    </div>
  );
}
```

---

### Example 3: Manual Cart Operations

```tsx
'use client';

import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';

export function CustomCartButton() {
  const addItem = useCartStore(s => s.addItem);
  const { success, error } = useToast();

  const handleClick = async () => {
    try {
      await addItem({
        variant_id: 'variant-uuid',
        product_id: 'product-uuid',
        name: 'Custom Product',
        image: 'https://...',
        price: '2500.00',
        quantity: 1,
        size: 'L',
        color: 'Blue',
      });

      success('Item added!');
    } catch (err) {
      error('Failed to add item');
    }
  };

  return <button onClick={handleClick}>Add Custom Item</button>;
}
```

---

## Data Flow

### Adding to Cart

```
1. User clicks "Add to Cart"
   ↓
2. AddToCartButton sets isAdding=true (shows spinner)
   ↓
3. cartStore.addItem() called
   ↓
4. OPTIMISTIC UPDATE:
   - Add item to store.items
   - Save to localStorage
   - UI updates instantly ✨
   ↓
5. BACKEND SYNC (if authenticated):
   - POST /api/cart/add/
   - On success: Replace items with backend data
   - On failure: Rollback + show error toast
   ↓
6. AddToCartButton shows checkmark
   ↓
7. Cart drawer opens
   ↓
8. Toast notification appears
```

---

### Updating Quantity

```
1. User clicks +/- button
   ↓
2. CartItem component shows loading spinner
   ↓
3. cartStore.updateQuantity(cartItemId, newQuantity)
   ↓
4. OPTIMISTIC UPDATE:
   - Update quantity in store
   - Save to localStorage
   ↓
5. BACKEND SYNC:
   - PUT /api/cart/update/{cartItemId}/
   - On failure: Rollback + error toast
   ↓
6. Loading spinner disappears
```

---

## Backend Integration

### Authenticated Users

- **Cart key**: `cart:{user_id}`
- **Storage**: Redis (7-day TTL)
- **Sync**: Every cart action syncs with backend
- **Persistence**: Survives across devices

### Guest Users

- **Cart key**: N/A (localStorage only)
- **Storage**: localStorage
- **Sync**: None (no backend calls)
- **Persistence**: Single device only

### Guest → User (Login)

When a guest logs in:

1. CartProvider detects login event
2. Calls `cartService.mergeCart()`
3. Backend merges guest cart into user cart
4. Frontend syncs with backend
5. localStorage updated with merged cart

---

## Error Handling

### Network Errors

```typescript
// Automatic retry via axios interceptor
// 401 → Token refresh → Retry request
// Other errors → Show toast + Rollback
```

### Stock Validation

```typescript
// Backend validates stock on add/update
// Returns 400 with error message
// Frontend shows error toast
error('Insufficient stock for Product Name');
```

### Concurrent Updates

```typescript
// Optimistic updates prevent UI lag
// Backend is source of truth
// Conflicts resolved by replacing with backend data
```

---

## Performance Optimizations

### 1. Optimistic Updates
- **UI responds instantly** (no waiting for backend)
- **Perceived performance**: Sub-100ms interactions

### 2. localStorage Caching
- **Instant cart load** on page refresh
- **No loading spinner** for cached data

### 3. Fire-and-Forget Sync
- **Guest users**: Zero backend calls
- **Authenticated users**: Async sync (doesn't block UI)

### 4. Minimal Re-renders
- Zustand selectors prevent unnecessary re-renders
- `useCartStore(s => s.items)` only re-renders when items change

---

## Testing

### Unit Tests (Example)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';

test('adds item optimistically', async () => {
  const { result } = renderHook(() => useCartStore());

  await act(async () => {
    await result.current.addItem({
      variant_id: 'v1',
      product_id: 'p1',
      name: 'Test Product',
      price: '100.00',
      quantity: 1,
      size: 'M',
      color: 'Black',
      image: '',
    });
  });

  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0].name).toBe('Test Product');
});
```

---

## Troubleshooting

### Issue: Cart not syncing with backend

**Check:**
1. Is `accessToken` in localStorage?
2. Check network tab for 401/403 errors
3. Verify `NEXT_PUBLIC_API_URL` env var

**Fix:**
```bash
# Check token
localStorage.getItem('accessToken')

# Force sync
useCartStore.getState().syncWithBackend()
```

---

### Issue: Cart disappears on refresh

**Check:**
1. Is localStorage enabled?
2. Browser in incognito mode?

**Fix:**
```typescript
// Manually save to localStorage
const cart = useCartStore.getState().items;
localStorage.setItem('cart', JSON.stringify(cart));
```

---

### Issue: Duplicate items in cart

**Cause:** Backend and frontend out of sync

**Fix:**
```typescript
// Force resync with backend
await useCartStore.getState().syncWithBackend();
```

---

## Migration Guide

### From Old Cart to New Cart

**Old Code:**
```tsx
const { addItem } = useCartStore();

addItem({
  variantId: variant.id,
  name: product.name,
  price: 1500,
  quantity: 1,
});

// No loading state
// No error handling
// No backend sync confirmation
```

**New Code:**
```tsx
<AddToCartButton
  item={{
    variant_id: variant.id,
    product_id: product.id,
    name: product.name,
    image: product.image,
    price: "1500.00",
    quantity: 1,
    size: "M",
    color: "Black",
  }}
  size="lg"
  fullWidth
/>

// ✅ Built-in loading states
// ✅ Error handling with toast
// ✅ Optimistic updates
// ✅ Backend sync confirmation
```

---

## Production Checklist

- [x] Optimistic updates implemented
- [x] Rollback on failure
- [x] Loading states on all actions
- [x] Error toast notifications
- [x] localStorage persistence
- [x] Backend sync for authenticated users
- [x] Guest cart support
- [x] TypeScript types
- [x] Cart initialization on app load
- [x] Toast notification system
- [x] Reusable AddToCartButton component

---

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cart/` | GET | Fetch cart |
| `/api/cart/add/` | POST | Add item |
| `/api/cart/update/{id}/` | PUT | Update quantity |
| `/api/cart/remove/{id}/` | DELETE | Remove item |
| `/api/cart/clear/` | DELETE | Clear cart |
| `/api/cart/coupon/` | POST | Apply coupon |
| `/api/cart/coupon/remove/` | DELETE | Remove coupon |
| `/api/cart/merge/` | POST | Merge guest cart |

---

## Summary

The new cart architecture provides:

1. **Instant feedback** - Optimistic updates make the UI feel instant
2. **Reliability** - Rollback mechanism prevents data loss
3. **User experience** - Loading states and toast notifications
4. **Offline support** - localStorage ensures cart persists
5. **Type safety** - Full TypeScript coverage
6. **Reusability** - AddToCartButton works anywhere
7. **Backend sync** - Keeps cart in sync with Redis

**Result:** A production-ready, user-friendly cart system that handles edge cases gracefully and provides excellent UX.
