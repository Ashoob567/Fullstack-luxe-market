# Frontend OTP Integration - Complete Guide

**Version:** 1.0  
**Date:** 2026-06-27  
**Stack:** Next.js 16.2 | React 19.2 | TypeScript 5

---

## 🎯 What Was Implemented

A complete frontend integration for the OTP verification system that:

✅ **Secure** – Card numbers never stored in localStorage/sessionStorage  
✅ **Resilient** – Cooldown timers survive page refresh  
✅ **Type-safe** – Full TypeScript coverage with proper interfaces  
✅ **User-friendly** – Clear error messages, countdown timers, retry logic  

---

## 📁 New Files Created

```
front-end/src/
├── lib/
│   ├── storage.ts                    # ⭐ Typed storage (card-safe)
│   └── otp-api.ts                    # OTP API client
├── hooks/
│   └── useCheckout.ts                # UPDATED - OTP flow
└── app/(checkout)/checkout/verify/
    └── page.tsx                      # ⭐ OTP verification page
```

---

## 🔒 Security Features

### 1. Card Number Protection

**CRITICAL:** Card numbers are NEVER persisted to browser storage.

```typescript
// ❌ WRONG - card stored in sessionStorage
savePendingOrder({
  ...orderData,
  card_number: cardNumber  // XSS risk!
});

// ✅ CORRECT - card excluded from storage
const pendingOrder: PendingOrder = {
  shipping_address: addressData,
  payment_method: selectedMethod,
  // card_number intentionally omitted
};
```

The card is re-entered on the verification page and sent directly to the backend without being stored.

### 2. Idempotency Key

Each checkout session generates a unique UUID that:
- Prevents duplicate orders on retry/refresh
- Is generated once and reused across retries
- Stored in sessionStorage (cleared on success)

```typescript
idempotency_key: crypto.randomUUID()  // Generated once per checkout
```

### 3. Storage Isolation

- **sessionStorage** - Used for:
  - Pending order data (cleared after success)
  - OTP cooldown timers (cleared after success)
  
- **localStorage** - Used for:
  - Cart items (cleared after successful order for guests)
  - Auth tokens (persistent)
  - Guest ID (persistent)

---

## 📦 File Details

### 1. storage.ts

Type-safe wrapper for browser storage.

**Key Functions:**

```typescript
// Pending Order (sessionStorage)
savePendingOrder(order: PendingOrder): void
loadPendingOrder(): PendingOrder | null
clearPendingOrder(): void

// OTP Cooldown (sessionStorage - survives refresh)
saveCooldownExpiry(seconds: number): void
loadCooldownRemaining(): number
clearCooldown(): void

// Cart (localStorage)
loadCart(): StoredCartItem[]
clearCart(): void

// Auth & Guest (localStorage)
isAuthenticated(): boolean
getOrCreateGuestId(): string
```

**Types:**

```typescript
interface PendingOrder {
  shipping_address: ShippingAddress;
  payment_method: "mock_card" | "cod";
  is_discreet: boolean;
  notes?: string;
  cart_id?: string;          // Guest only
  cart_items?: CartItem[];   // Guest only
  idempotency_key: string;   // UUID
  // ⚠️ card_number intentionally absent
}
```

### 2. otp-api.ts

API client for OTP endpoints.

**Functions:**

```typescript
sendOTP(data: SendOTPRequest): Promise<SendOTPResponse>
verifyAndCreateOrder(data: VerifyAndCreateOrderRequest): Promise<VerifyAndCreateOrderResponse>
```

**Request Types:**

```typescript
interface SendOTPRequest {
  contact: string;
  contact_type: "email" | "phone";
}

interface VerifyAndCreateOrderRequest {
  contact: string;
  contact_type: "email" | "phone";
  otp: string;
  idempotency_key: string;
  order_data: {
    shipping_address: Record<string, unknown>;
    payment_method: string;
    card_number?: string;  // Re-entered at verify time
    is_discreet: boolean;
    notes?: string;
    cart_id?: string;
    cart_items?: unknown[];
  };
}
```

### 3. useCheckout.ts (Updated)

The `placeOrder` function now redirects to `/checkout/verify` instead of directly creating the order:

**Before:**
```typescript
const placeOrder = async () => {
  // Direct API call to create-intent
  const data = await post('/api/payments/create-intent/', payload);
  router.push(`/order/success?id=${data.order_id}`);
};
```

**After:**
```typescript
const placeOrder = () => {
  // Save order data to sessionStorage
  const pendingOrder: PendingOrder = {
    shipping_address: addressData,
    payment_method: selectedMethod,
    is_discreet: isDiscreet,
    idempotency_key: crypto.randomUUID(),
    // card_number excluded - re-entered at verify
  };
  savePendingOrder(pendingOrder);
  router.push("/checkout/verify");
};
```

### 4. verify/page.tsx

Complete OTP verification page with:

**Features:**
- Email OR Phone verification choice
- Countdown timers (OTP expiry, resend cooldown)
- Card re-entry (for mock_card payments only)
- Retry logic with attempts remaining
- Lockout handling (force new OTP after 5 failures)
- Error boundaries

**State Management:**

```typescript
const [selectedMethod, setSelectedMethod] = useState<"email" | "phone" | null>(null);
const [otpSent, setOtpSent] = useState(false);
const [otpCode, setOtpCode] = useState("");
const [cardNumber, setCardNumber] = useState("");  // Re-entered, never stored
const [resendCooldown, setResendCooldown] = useState(0);
const [otpExpirySeconds, setOtpExpirySeconds] = useState(600);
const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
```

**UI Flow:**

1. Load pending order from sessionStorage
2. Show verification method choice (Email OR Phone)
3. Send OTP → Show countdown
4. Enter OTP code
5. Verify & Create Order
6. Redirect to success page

---

## 🚀 Testing

### 1. Start Backend

```bash
cd back-end
python manage.py runserver
redis-server  # In separate terminal
```

### 2. Start Frontend

```bash
cd front-end
npm run dev
```

### 3. Test Checkout Flow

1. Add items to cart
2. Go to `/checkout`
3. Fill shipping address
4. Choose payment method (COD or Card)
5. Click "Place Order"
6. **Redirected to `/checkout/verify`**
7. Choose Email or Phone
8. Send OTP → Check terminal for code (console backend in DEBUG mode)
9. Enter code
10. Click "Verify & Place Order"
11. Redirected to `/order/success`

### 4. Test Edge Cases

**Rate Limiting:**
```bash
# Send 6 OTP requests rapidly → 6th should fail with 429
```

**Lockout:**
```bash
# Enter wrong OTP 5 times → Locked out, forced to request new code
```

**Page Refresh:**
```bash
# Refresh /checkout/verify → Cooldown timer should persist
```

**Idempotency:**
```bash
# Submit same order twice (same idempotency_key) → Returns same order_id
```

---

## 🐛 Common Issues

### 1. "No order data found" Error

**Cause:** sessionStorage cleared or navigated directly to `/checkout/verify`

**Fix:**
```typescript
// Always start from /checkout, not /checkout/verify
router.push("/checkout");
```

### 2. Cooldown Not Persisting

**Cause:** Using `useState` instead of sessionStorage

**Fix:**
```typescript
// ✅ CORRECT - survives refresh
saveCooldownExpiry(60);
const remaining = loadCooldownRemaining();

// ❌ WRONG - lost on refresh
const [cooldown, setCooldown] = useState(60);
```

### 3. Card Number Always "Invalid"

**Cause:** Spaces not stripped before sending

**Fix:**
```typescript
// Strip spaces/dashes
card_number: cardNumber.replace(/\s|-/g, "")
```

### 4. TypeScript Errors

**Cause:** Mismatched CartItem types

**Fix:**
```typescript
// Use StoredCartItem for localStorage
const items = loadCart(); // StoredCartItem[]

// Transform to CartItem for backend
const backendItems = items.map((item) => ({
  product_id: item.product_id,
  product_name: item.name,
  unit_price: parseFloat(item.price),
  // ...
}));
```

---

## 📖 Integration Checklist

- [x] Create `src/lib/storage.ts` with typed storage functions
- [x] Create `src/lib/otp-api.ts` with OTP API client
- [x] Update `src/hooks/useCheckout.ts` to use OTP flow
- [x] Create `src/app/(checkout)/checkout/verify/page.tsx`
- [x] Test email OTP flow
- [x] Test phone OTP flow (console logger in DEBUG mode)
- [x] Test card re-entry for mock_card payments
- [x] Test COD flow (no card re-entry)
- [x] Test page refresh (cooldown persistence)
- [x] Test rate limiting (5 OTP sends per min)
- [x] Test lockout (5 wrong OTP attempts)
- [x] Test idempotency (retry same request)

---

## 🎨 UI Components Used

All components from shadcn/ui:

- `Button` - Action buttons
- `Input` - OTP code, card number
- `Label` - Form labels
- `Card` - Content containers
- `Alert` - Success/info messages
- `Loader2`, `Mail`, `Phone`, `Clock`, etc. - Lucide icons

**Installation:**
```bash
npx shadcn add button input label card alert
```

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────┐
│  /checkout (page.tsx)                       │
│  - Fill shipping address                    │
│  - Choose payment method                    │
│  - Click "Place Order"                      │
└──────────────────┬──────────────────────────┘
                   │
                   │ useCheckout.placeOrder()
                   │ → savePendingOrder()
                   │ → router.push("/checkout/verify")
                   ▼
┌─────────────────────────────────────────────┐
│  /checkout/verify (verify/page.tsx)         │
│  - Load pending order from sessionStorage   │
│  - Choose Email OR Phone                    │
│  - Send OTP → sendOTP()                     │
└──────────────────┬──────────────────────────┘
                   │
                   │ POST /api/payments/send-otp/
                   │ ← OTP sent (check terminal)
                   ▼
┌─────────────────────────────────────────────┐
│  - Enter 6-digit code                       │
│  - Re-enter card (if mock_card)             │
│  - Click "Verify & Place Order"             │
│  → verifyAndCreateOrder()                   │
└──────────────────┬──────────────────────────┘
                   │
                   │ POST /api/payments/verify-and-create-order/
                   │ ← Order created (status: success)
                   │
                   │ clearPendingOrder()
                   │ clearCooldown()
                   │ clearCart() (guest only)
                   ▼
┌─────────────────────────────────────────────┐
│  /order/success?id={order_id}               │
│  - Order confirmation                       │
└─────────────────────────────────────────────┘
```

---

## 🚢 Production Considerations

### 1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.luxemarket.com
```

### 2. Error Tracking

Add Sentry or similar:

```typescript
try {
  await sendOTP({ contact, contact_type });
} catch (err) {
  Sentry.captureException(err);
  toast.error("Failed to send code");
}
```

### 3. Analytics

Track OTP events:

```typescript
// Send OTP
analytics.track("otp_sent", {
  contact_type: selectedMethod,
  timestamp: Date.now(),
});

// Verify OTP
analytics.track("otp_verified", {
  contact_type: selectedMethod,
  success: true,
});
```

### 4. A/B Testing

Test email vs phone preference:

```typescript
// Default to email for 50% of users
const defaultMethod = Math.random() < 0.5 ? "email" : "phone";
```

---

## 📚 API Reference

### Backend Endpoints

**POST /api/payments/send-otp/**

Request:
```json
{
  "contact": "test@example.com",
  "contact_type": "email"
}
```

Response:
```json
{
  "message": "Verification code sent.",
  "otp_expires_in_seconds": 600,
  "resend_available_in_seconds": 60
}
```

**POST /api/payments/verify-and-create-order/**

Request:
```json
{
  "contact": "test@example.com",
  "contact_type": "email",
  "otp": "123456",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "order_data": {
    "shipping_address": {...},
    "payment_method": "cod",
    "is_discreet": false,
    "cart_items": [...]
  }
}
```

Response (Success):
```json
{
  "status": "success",
  "order_id": "a1b2c3d4-...",
  "order_number": "LM-A1B2C3D4",
  "order_summary": {
    "total": "5200.00",
    "payment_method": "cod",
    "order_status": "confirmed"
  }
}
```

Response (Invalid OTP):
```json
{
  "verified": false,
  "reason": "invalid",
  "attempts_remaining": 3
}
```

Response (Locked):
```json
{
  "verified": false,
  "reason": "locked"
}
```

---

## 🎯 Next Steps

### Phase 3: Observability & Hardening

1. **Frontend Analytics**
   - Track OTP funnel (sent → verified → order created)
   - Measure time-to-verify
   - Track failure reasons

2. **Error Handling**
   - Add Sentry integration
   - Capture network errors
   - Track retry patterns

3. **UX Improvements**
   - Auto-advance OTP input (6 individual digits)
   - Auto-submit when 6 digits entered
   - Haptic feedback on mobile

4. **Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation
   - Focus management

5. **Performance**
   - Preload verification page
   - Optimize bundle size
   - Lazy load components

---

## 📞 Support

- **Documentation:** See `/back-end/OTP_IMPLEMENTATION_GUIDE.md`
- **API Docs:** http://localhost:8000/api/schema/swagger-ui/
- **Backend Metrics:** http://localhost:8000/metrics

---

**Status:** ✅ Phase 2 Complete - Frontend Integration  
**Next:** Phase 3 - Observability & Hardening  
**Date:** 2026-06-27
