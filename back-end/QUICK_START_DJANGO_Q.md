# ⚡ Django Q Quick Start - 5 Minutes

Get Django Q running in 5 minutes for Luxe Market.

---

## 🚀 **STEP 1: Install** (1 minute)

```bash
cd back-end
pip install django-q2
```

---

## 🗄️ **STEP 2: Run Migrations** (30 seconds)

```bash
python manage.py migrate
```

Expected output:
```
Running migrations:
  Applying django_q.0001_initial... OK
  Applying django_q.0002_auto... OK
  ...
```

---

## 📅 **STEP 3: Setup Scheduled Tasks** (30 seconds)

```bash
python manage.py setup_django_q_schedules
```

Expected output:
```
Setting up Django Q scheduled tasks...
✅ Created: Expire Flash Sales (every 5 min)
✅ Created: Clear Expired Carts (every 6 hours)
✅ Created: Expire Old Coupons (daily 2 AM)
✅ Created: Daily Sales Report (daily 9 AM)
...
✅ Created 7 new scheduled tasks
```

---

## ▶️ **STEP 4: Start Worker** (30 seconds)

Open **new terminal window** (keep `runserver` running in another):

```bash
cd back-end
python manage.py qcluster
```

Expected output:
```
12:00:00 [Q] INFO Q Cluster LuxeMarket running.
12:00:00 [Q] INFO Process-1 ready for work at 12345
12:00:00 [Q] INFO Process-2 ready for work at 12346
12:00:00 [Q] INFO Process-3 ready for work at 12347
12:00:00 [Q] INFO Process-4 ready for work at 12348
```

✅ **Django Q is now running!**

---

## 🧪 **STEP 5: Test It** (2 minutes)

### Test 1: Create an Order
1. Go to checkout: `http://localhost:3000/checkout`
2. Complete an order (COD or card)
3. Check the `qcluster` terminal window

**Expected output:**
```
12:05:23 [Q] INFO Enqueued order_confirmation_LM-A1B2C3D4
12:05:23 [Q] INFO Processing order_confirmation_LM-A1B2C3D4
12:05:24 [Q] INFO Email sent successfully to user@example.com: Order Confirmation
12:05:24 [Q] INFO Saved task: order_confirmation_LM-A1B2C3D4 [SUCCESS]
```

**In console (email):**
```
Content-Type: text/plain; charset="utf-8"
Subject: Order Confirmation - LM-A1B2C3D4
From: Luxe Market <noreply@luxemarket.com>
To: user@example.com

[Full HTML email content displayed]
```

---

### Test 2: Manual Task Execution
```bash
python manage.py shell
```

```python
# Test flash sale expiration
>>> from apps.products.tasks import expire_flash_sales
>>> expire_flash_sales()
'No flash sales to expire'  # Or "Expired X flash sales"

# Test cart cleanup
>>> from apps.cart.tasks import clear_expired_carts
>>> clear_expired_carts()
'Cleared 0 expired carts'

# Test order confirmation email
>>> from apps.orders.tasks import send_order_confirmation_email
>>> from apps.orders.models import Order
>>> order = Order.objects.first()  # Get any order
>>> send_order_confirmation_email(str(order.id))
'Order confirmation sent to user@example.com'
```

---

### Test 3: View in Admin
1. Go to Django admin: `http://localhost:8000/admin/`
2. Navigate to **Django Q** section
3. Click **Successful tasks** - See all completed tasks
4. Click **Scheduled tasks** - See periodic task schedule

---

## 📊 **What You Get**

After setup, these tasks run automatically:

| Task | Frequency | What It Does |
|------|-----------|--------------|
| Order confirmation emails | Instant | Sent after checkout |
| Flash sale expiration | Every 5 min | Deactivates expired flash sales |
| Cart cleanup | Every 6 hours | Removes old carts from Redis |
| Coupon expiration | Daily 2 AM | Deactivates expired coupons |
| Daily sales report | Daily 9 AM | Generates sales summary |
| Low stock alerts | Instant | Alerts when stock < 5 |

---

## 🎯 **Production Deployment**

### Create systemd Service

```bash
sudo nano /etc/systemd/system/luxe-market-qcluster.service
```

```ini
[Unit]
Description=Luxe Market Django Q Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/luxe-market/back-end
Environment="PATH=/var/www/luxe-market/venv/bin"
ExecStart=/var/www/luxe-market/venv/bin/python manage.py qcluster
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable luxe-market-qcluster
sudo systemctl start luxe-market-qcluster
sudo systemctl status luxe-market-qcluster
```

---

## 🔧 **Configuration**

### Email Settings (Production)

Edit `.env`:
```bash
# For Gmail
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Get from Google Account settings
DEFAULT_FROM_EMAIL=Luxe Market <orders@luxemarket.com>
```

### Performance Tuning

Edit `config/settings/base.py`:
```python
Q_CLUSTER = {
    'workers': 4,  # Increase for more concurrent tasks
    'timeout': 60,  # Task timeout
    'retry': 120,  # Retry interval
}
```

---

## 🚨 **Troubleshooting**

### "Django Q not running"
```bash
# Check if worker is running
ps aux | grep qcluster

# Restart worker
python manage.py qcluster
```

### "Tasks not executing"
```bash
# Check failed tasks in admin
http://localhost:8000/admin/django_q/failure/

# Run task manually in shell
python manage.py shell
>>> from apps.orders.tasks import send_order_confirmation_email
>>> send_order_confirmation_email('order-id')
```

### "Emails not sending"
```bash
# Check console backend (development)
# Emails print to qcluster terminal, not runserver terminal

# For production, check SMTP settings in .env
```

---

## ✅ **You're Done!**

Django Q is now:
- ✅ Installed and configured
- ✅ Running in background
- ✅ Sending order confirmation emails
- ✅ Running 7 scheduled tasks automatically
- ✅ Logging all activity to admin dashboard

**Next Steps:**
- Test order checkout to see emails
- Monitor tasks in Django admin
- Review [DJANGO_Q_SETUP.md](DJANGO_Q_SETUP.md) for advanced features

---

**Need more help?** See [DJANGO_Q_SETUP.md](DJANGO_Q_SETUP.md) for detailed documentation.
