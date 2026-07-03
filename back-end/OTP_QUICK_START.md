# OTP Verification System - Quick Start Guide

## 🎯 What Was Implemented

A production-grade two-factor verification system for completing checkout with OTP verification via **email OR phone**.

## ✅ Completed Tasks

### Phase 1: Backend Foundation ✓

1. **Core Infrastructure**
   - ✅ Created `apps/core/` with middleware, monitoring, and logging
   - ✅ Added RequestIDMiddleware for distributed tracing
   - ✅ Configured structured logging (structlog + JSON formatter)
   - ✅ Set up Prometheus metrics collection

2. **OTP Service Layer**
   - ✅ `apps/payments/otp_service.py` - Complete OTP logic:
     - Cryptographically secure OTP generation (6 digits)
     - SHA-256 hashing for storage
     - Constant-time verification (timing-attack resistant)
     - Rate limiting (3 sends per 10min, 60s cooldown)
     - Lockout protection (5 failed attempts)
     - User-scoped verification flags
   
3. **Checkout Service Layer**
   - ✅ `apps/payments/checkout_service.py` - Order creation:
     - Cart resolution (Redis + fallback)
     - Totals calculation
     - Mock payment processing
     - Atomic order + line items creation
     - Idempotency enforcement

4. **API Layer**
   - ✅ Request/response serializers with validation
   - ✅ `POST /api/payments/send-otp/` endpoint
   - ✅ `POST /api/payments/verify-and-create-order/` endpoint
   - ✅ Rate limiting (django-ratelimit)
   - ✅ OpenAPI schema generation (drf-spectacular)

5. **Database**
   - ✅ Added `Order.idempotency_key` field (UUID, unique index)
   - ✅ Migration created (run `python manage.py migrate`)

6. **Monitoring**
   - ✅ `/metrics` endpoint for Prometheus
   - ✅ OTP metrics (sent, verified, latency)
   - ✅ Order creation metrics
   - ✅ Redis health metrics

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
cd back-end
pip install -r requirements/base.txt
```

New packages:
- structlog, python-json-logger
- prometheus-client
- drf-spectacular

### 2. Configure Environment

Add to `.env`:

```bash
# Redis (required)
REDIS_URL=redis://localhost:6379

# Email (for OTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Luxe Market <noreply@luxemarket.com>

# Optional: Twilio for SMS (uses console logger in DEBUG mode)
# TWILIO_SID=...
# TWILIO_TOKEN=...
# TWILIO_PHONE=...
```

### 3. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Start Services

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Django
python manage.py runserver
```

## 🧪 Quick Test

### Test 1: Send OTP

```bash
curl -X POST http://localhost:8000/api/payments/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "test@example.com",
    "contact_type": "email"
  }'
```

**Expected response:**
```json
{
  "message": "Verification code sent.",
  "otp_expires_in_seconds": 600,
  "resend_available_in_seconds": 60
}
```

**Check terminal for OTP** (console backend in DEBUG mode):
```
Your verification code is: 123456
```

### Test 2: Verify OTP & Create Order

```bash
curl -X POST http://localhost:8000/api/payments/verify-and-create-order/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "test@example.com",
    "contact_type": "email",
    "otp": "123456",
    "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
    "order_data": {
      "shipping_address": {
        "firstName": "Test",
        "lastName": "User",
        "phone": "03001234567",
        "streetAddress": "123 Test St",
        "city": "Lahore",
        "province": "Punjab",
        "postalCode": "54000",
        "email": "test@example.com"
      },
      "payment_method": "cod",
      "cart_items": [
        {
          "product_id": "00000000-0000-0000-0000-000000000001",
          "product_name": "Test Product",
          "unit_price": "1000.00",
          "quantity": 1
        }
      ]
    }
  }'
```

**Expected response:**
```json
{
  "verified": true,
  "order": {
    "id": "...",
    "order_number": "LM-...",
    "status": "confirmed",
    "payment_status": "pending",
    "payment_method": "cod",
    "total_amount": "1200.00",
    "created_at": "2026-06-26T..."
  },
  "message": "Order placed successfully!"
}
```

## 📊 Check Metrics

Visit: http://localhost:8000/metrics

Look for:
```
otp_sent_total{contact_type="email",status="success"} 1.0
otp_verify_total{contact_type="email",status="success"} 1.0
order_created_total{payment_method="cod",status="success"} 1.0
```

## 🔒 Security Features Implemented

✅ **Timing attack prevention** - `hmac.compare_digest()` for OTP verification  
✅ **Rate limiting** - 5 req/min per IP, 3 sends per contact per 10min  
✅ **Lockout protection** - 5 failed attempts → force new OTP  
✅ **OTP hashing** - SHA-256 in Redis (no plaintext)  
✅ **Idempotency** - Unique key prevents duplicate orders  
✅ **User-scoped verification** - Prevents session hijacking  
✅ **Atomic transactions** - Order + items created together  

## 📁 New Files Created

```
back-end/
├── apps/
│   ├── core/                          # NEW
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── middleware.py              # Request ID middleware
│   │   └── monitoring.py              # Prometheus metrics
│   └── payments/
│       ├── otp_service.py             # NEW - OTP core logic
│       ├── checkout_service.py        # NEW - Order creation
│       ├── serializers.py             # NEW - Request validation
│       ├── mock_gateway.py            # NEW - Payment simulation
│       ├── views.py                   # UPDATED - Added OTP endpoints
│       └── urls.py                    # UPDATED - Added OTP routes
├── config/
│   ├── logging.py                     # NEW - Structured logging
│   ├── settings/base.py               # UPDATED - Added logging/middleware
│   └── urls.py                        # UPDATED - Added /metrics endpoint
├── requirements/base.txt              # UPDATED - Added dependencies
├── OTP_IMPLEMENTATION_GUIDE.md        # NEW - Full documentation
└── OTP_QUICK_START.md                 # NEW - This file
```

## 🎯 Next Steps

### For Backend:
1. ✅ Install dependencies: `pip install -r requirements/base.txt`
2. ✅ Run migrations: `python manage.py migrate`
3. ✅ Configure `.env` file
4. ✅ Test endpoints with curl

### For Frontend:
1. Create verification page component
2. Implement OTP input (6 digits)
3. Add countdown timer (10 min expiry, 60s resend cooldown)
4. Handle error states (invalid, locked, expired)
5. Integrate with checkout flow

### For Production:
1. Set up Twilio for SMS (currently uses console logger)
2. Configure production SMTP (SendGrid/Mailgun)
3. Set up Prometheus + Grafana dashboards
4. Enable HTTPS and security headers
5. Add integration tests

## 📚 Documentation

- **Full Guide:** `OTP_IMPLEMENTATION_GUIDE.md` - Complete implementation details
- **API Docs:** http://localhost:8000/api/schema/swagger-ui/ (when drf-spectacular is configured)
- **Metrics:** http://localhost:8000/metrics

## 🐛 Common Issues

### Redis not running
```bash
# Error: "Service temporarily unavailable"
# Fix: Start Redis
redis-server
```

### Email not sending
```bash
# Check terminal for OTP (console backend in DEBUG mode)
# In production, configure SMTP in .env
```

### Migration errors
```bash
# Error: "column idempotency_key does not exist"
# Fix: Run migrations
python manage.py makemigrations
python manage.py migrate
```

## 📞 Support

- **Documentation:** See `OTP_IMPLEMENTATION_GUIDE.md`
- **API Reference:** See `/api/schema/swagger-ui/` (after setup)
- **Logs:** Check terminal output (structured JSON logs)

---

**Status:** ✅ Phase 1 Complete - Backend Foundation  
**Next:** Frontend Integration  
**Date:** 2026-06-26
