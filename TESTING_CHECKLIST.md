# OTP System Testing Checklist

Quick reference for testing the complete OTP verification system.

---

## 🚀 Quick Start (3 minutes)

```bash
# Terminal 1: Backend
cd back-end
python manage.py runserver

# Terminal 2: Redis
redis-server

# Terminal 3: Frontend
cd front-end
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Metrics: http://localhost:8000/metrics

---

## ✅ Basic Flow Test (5 minutes)

### 1. Add to Cart
- Go to http://localhost:3000
- Add any product to cart
- Click cart icon → "Proceed to Checkout"

### 2. Checkout Form
- **Shipping Address:**
  - Name: Test User
  - Email: `test@example.com`
  - Phone: `03001234567`
  - Address: 123 Test St, Lahore, Punjab, 54000

- **Payment Method:**
  - Choose "Cash on Delivery" (easier for testing)

- Click **"Place Order"**

### 3. Verification Page (NEW)
- **Redirected to:** `/checkout/verify`
- Choose "Verify via Email" or "Verify via Phone"
- Click "Send Verification Code"

### 4. Get OTP from Terminal
**Backend terminal shows:**
```
Your verification code is: 123456
```

### 5. Enter Code & Complete
- Enter the 6-digit code
- Click "Verify & Place Order"
- **Redirected to:** `/order/success`

**✅ SUCCESS!** Order created.

---

## 🧪 Test Cards (for mock_card payment)

Test different card behaviors:

| Card Number | Result |
|-------------|--------|
| `4242424242424242` | ✅ Success |
| `4000000000000002` | ❌ Declined (insufficient funds) |
| `4000000000009995` | ❌ Declined (processing error) |

**Note:** Card number is re-entered on verification page (not stored).

---

## 🔍 Security Tests

### Test 1: Card Not Stored

```javascript
// Open DevTools → Application → Session Storage
sessionStorage.getItem('luxe_pending_order')
// Should NOT contain "card_number"
```

✅ **PASS** if card_number is absent.

### Test 2: Rate Limiting

```bash
# Send 6 OTP requests rapidly (within 1 minute)
# Expected: 5 succeed, 6th returns "Too many requests"
```

✅ **PASS** if 6th request is blocked.

### Test 3: Lockout Protection

```bash
# Enter wrong OTP 5 times
# Expected: "Too many incorrect attempts. Please request a new code."
```

✅ **PASS** if locked out after 5 failures.

### Test 4: Cooldown Persistence

```bash
# 1. Send OTP (60s cooldown starts)
# 2. Refresh page
# Expected: Cooldown timer still shows remaining seconds
```

✅ **PASS** if cooldown persists after refresh.

### Test 5: Idempotency

```bash
# 1. Complete order successfully
# 2. Click browser back button
# 3. Click "Verify & Place Order" again (same idempotency_key)
# Expected: Returns same order_id (no duplicate created)
```

✅ **PASS** if same order returned.

---

## 📊 Backend Verification

### Check Redis Keys

```bash
redis-cli

# List all OTP keys
KEYS otp:*
# Output: "otp:email:test@example.com"

# Check OTP value (should be hashed)
GET otp:email:test@example.com
# Output: "a1b2c3d4..." (SHA-256 hash, NOT plaintext)

# Check attempts
GET otp:attempts:email:test@example.com
# Output: "1" (number of sends)

# Check resend cooldown
TTL otp:resend:email:test@example.com
# Output: 47 (seconds remaining)
```

### Check Prometheus Metrics

```bash
curl http://localhost:8000/metrics | grep otp

# Expected output:
# otp_sent_total{contact_type="email",status="success"} 1.0
# otp_verify_total{contact_type="email",status="success"} 1.0
# order_created_total{payment_method="cod",status="success"} 1.0
```

### Check Django Logs

```bash
# Backend terminal should show structured JSON logs:

{
  "event": "otp_sent",
  "contact_type": "email",
  "timestamp": "2026-06-27T12:34:56Z"
}

{
  "event": "otp_verified",
  "contact_type": "email",
  "timestamp": "2026-06-27T12:35:12Z"
}

{
  "event": "order_created_after_otp_verification",
  "order_number": "LM-A1B2C3D4",
  "payment_method": "cod"
}
```

---

## 🐛 Troubleshooting

### Issue: "No order data found"

**Cause:** Navigated directly to `/checkout/verify` or sessionStorage cleared.

**Fix:**
```bash
# Always start from /checkout, not /checkout/verify
```

### Issue: Email not sending

**Cause:** Django email backend not configured.

**Check:**
```bash
# Backend terminal should show console output with OTP
# In DEBUG mode, emails are logged to console, not sent
```

### Issue: Redis connection error

**Cause:** Redis not running.

**Fix:**
```bash
# Check Redis status
redis-cli ping
# Should return: PONG

# If not running, start it:
redis-server
```

### Issue: OTP always "Invalid"

**Cause:** Using wrong OTP or expired.

**Check:**
```bash
# 1. Check backend terminal for OTP
# 2. Verify OTP is entered correctly (6 digits)
# 3. Check expiry (10 minutes from send)
```

### Issue: Frontend not connecting to backend

**Cause:** Backend not running or wrong URL.

**Check:**
```bash
# 1. Verify backend is running: http://localhost:8000
# 2. Check NEXT_PUBLIC_API_URL in .env.local
# 3. Check browser console for CORS errors
```

---

## 📝 Test Results Template

Use this template to document your test results:

```markdown
## Test Date: YYYY-MM-DD
## Tester: [Your Name]

### Basic Flow
- [ ] Add to cart
- [ ] Checkout form
- [ ] Redirect to /checkout/verify
- [ ] Send OTP (email)
- [ ] Send OTP (phone)
- [ ] Enter code
- [ ] Verify & place order
- [ ] Redirect to /order/success

### Security
- [ ] Card not in sessionStorage
- [ ] Rate limiting works
- [ ] Lockout after 5 failures
- [ ] Cooldown persists on refresh
- [ ] Idempotency works

### Edge Cases
- [ ] Back button (data persists)
- [ ] Page refresh (cooldown persists)
- [ ] Direct navigation to /verify (redirects)
- [ ] Expired OTP (error shown)
- [ ] Wrong OTP (attempts shown)

### Backend
- [ ] Redis keys present
- [ ] OTP hashed (not plaintext)
- [ ] Prometheus metrics updating
- [ ] Django logs showing events

### Issues Found
[List any issues here]

### Notes
[Additional observations]
```

---

## 🎯 Success Criteria

✅ **All tests pass** if:

1. Order completes successfully via email OTP
2. Order completes successfully via phone OTP
3. Card number NOT in browser storage
4. Rate limiting blocks 6th request
5. Lockout after 5 wrong attempts
6. Cooldown timer persists on refresh
7. Idempotency prevents duplicates
8. Redis keys show hashed OTPs
9. Prometheus metrics update
10. Django logs show structured events

---

## 📞 Support

**If tests fail:**

1. Check backend terminal for errors
2. Check browser console for errors
3. Check Redis with `redis-cli KEYS otp:*`
4. Review documentation:
   - `/back-end/OTP_QUICK_START.md`
   - `/front-end/FRONTEND_OTP_INTEGRATION.md`

---

**Last Updated:** 2026-06-27  
**Version:** 1.0  
**Status:** Ready for Testing
