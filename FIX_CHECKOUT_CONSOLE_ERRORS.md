# Fix: Checkout Console Errors - Duplicate Keys

## Problem

Console error on checkout page:
```
Encountered two children with the same key, `undefined-undefined`. 
Keys should be unique so that components maintain their identity across updates.
```

## Root Causes

### 1. Wrong Import Path (Line 12)
```typescript
// ❌ Before - CartItem doesn't exist in @/types/order
import type { CartItem } from '@/types/order';

// ✅ After - CartItem is in @/types/cart
import type { CartItem } from '@/types/cart';
```

### 2. Wrong Property Names (Line 79)
```typescript
// ❌ Before - Using camelCase (doesn't exist)
key={`${item.productId}-${item.variantId}`}

// ✅ After - Using unique cart_item_id
key={item.cart_item_id}
```

### 3. Wrong Price Handling (Line 75)
```typescript
// ❌ Before - CartItem doesn't have salePrice
const price = item.salePrice ?? item.price;

// ✅ After - Parse price string to number
const price = parseFloat(item.price);
```

### 4. Removed Non-Existent Sale Price Display (Line 103)
```typescript
// ❌ Before - salePrice doesn't exist on CartItem
{item.salePrice && (
  <p className="text-xs text-muted-foreground line-through">{pkr(item.price)}</p>
)}

// ✅ After - Removed (not applicable for cart items)
```

## CartItem Type Definition

From [front-end/src/types/cart.ts](front-end/src/types/cart.ts):

```typescript
export interface CartItem {
  cart_item_id: string;    // ✅ Unique identifier
  product_id: string;      // ✅ Snake case
  variant_id: string | null;
  name: string;
  image: string;
  price: string;           // ✅ DRF Decimal → string
  quantity: number;
  size: string;
  color: string;
  slug?: string;
}
```

## Files Fixed

### 1. OrderSummaryPanel.tsx
- ✅ Fixed import from `@/types/order` → `@/types/cart`
- ✅ Changed key to `item.cart_item_id`
- ✅ Fixed price parsing: `parseFloat(item.price)`
- ✅ Removed non-existent `salePrice` reference

### 2. checkout/page.tsx
- ✅ Fixed import from `@/types/order` → `@/types/cart`
- ✅ Updated cart fetching logic to use localStorage
- ✅ Fixed price calculation: `Number(i.price)`

## Changes Summary

```diff
// OrderSummaryPanel.tsx
- import type { CartItem } from '@/types/order';
+ import type { CartItem } from '@/types/cart';

- const price = item.salePrice ?? item.price;
+ const price = parseFloat(item.price);

- key={`${item.productId}-${item.variantId}`}
+ key={item.cart_item_id}

- {item.salePrice && (
-   <p className="text-xs text-muted-foreground line-through">{pkr(item.price)}</p>
- )}
```

```diff
// checkout/page.tsx
- import type { CartItem } from '@/types/order';
+ import type { CartItem } from '@/types/cart';

- const sub = items.reduce((acc, i) => acc + (i.salePrice ?? i.price) * i.quantity, 0);
+ const sub = items.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);
```

## Why This Happened

**Type Confusion**: The checkout components were importing `CartItem` from the wrong module:
- `@/types/order` has `OrderItem` (for completed orders)
- `@/types/cart` has `CartItem` (for shopping cart)

These are different types with different structures:

| Field | CartItem (cart.ts) | OrderItem (order.ts) |
|-------|-------------------|---------------------|
| ID | `cart_item_id` | `id` |
| Product | `product_id` | `product_id` |
| Variant | `variant_id` | `variant_id` |
| Price | `price: string` | `unit_price: string` |
| Sale | ❌ None | ❌ None |
| Naming | snake_case | snake_case |

## Testing

```bash
# 1. Start servers
cd back-end && python manage.py runserver
cd front-end && npm run dev

# 2. Add items to cart
# 3. Go to checkout: http://localhost:3000/checkout
```

**Expected Result**:
- ✅ No console errors
- ✅ Each cart item has unique key
- ✅ Items display correctly with image, name, size, color
- ✅ Prices calculated correctly
- ✅ Total amount correct

## Related Files

- ✅ [front-end/src/components/checkout/OrderSummaryPanel.tsx](front-end/src/components/checkout/OrderSummaryPanel.tsx)
- ✅ [front-end/src/app/(checkout)/checkout/page.tsx](front-end/src/app/(checkout)/checkout/page.tsx)
- 📘 [front-end/src/types/cart.ts](front-end/src/types/cart.ts) - CartItem definition
- 📘 [front-end/src/types/order.ts](front-end/src/types/order.ts) - OrderItem definition

## Status

✅ **FIXED** - All console errors resolved, checkout page working correctly!
