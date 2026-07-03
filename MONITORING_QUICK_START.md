# 🚀 Monitoring Quick Start

Get Prometheus + Grafana running in 5 minutes.

---

## Step 1: Start Docker Desktop
Make sure Docker Desktop is running on your Windows machine.

---

## Step 2: Start Monitoring Stack

```bash
cd c:\python_projects\luxe-market-project\monitoring
start.bat
```

This will start:
- ✅ Prometheus (port 9090)
- ✅ Grafana (port 3000)

---

## Step 3: Start Django

```bash
cd c:\python_projects\luxe-market-project\back-end
python manage.py runserver
```

---

## Step 4: Access Dashboards

### Grafana (Main Dashboard)
- **URL**: http://localhost:3000
- **Username**: `admin`
- **Password**: `admin`
- **Dashboard**: Dashboards → "Luxe Market - Overview"

### Prometheus (Raw Metrics)
- **URL**: http://localhost:9090
- **Try query**: `otp_sent_total`

### Django Metrics Endpoint
- **URL**: http://localhost:8000/metrics

---

## Step 5: Generate Test Data (Optional)

To see metrics in action:

```bash
cd c:\python_projects\luxe-market-project\back-end
python test_metrics.py
```

Then refresh Grafana dashboard to see the data.

---

## What You'll See

### In Grafana Dashboard:

1. **OTP Send Rate** - Real-time OTP requests
2. **OTP Success Rate** - Percentage gauge
3. **Active Verifications** - Current count
4. **OTP Latency** - Response times (p50, p95, p99)
5. **Order Creation Rate** - Orders per second
6. **Order Latency** - Order processing times
7. **Redis Errors** - System health

---

## Common Commands

```bash
# Start monitoring
cd monitoring
docker-compose up -d

# Stop monitoring
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Check status
docker ps
```

---

## Troubleshooting

### ❌ "No data" in Grafana

**Check:**
1. Is Django running? → `curl http://localhost:8000/metrics`
2. Is Prometheus scraping? → http://localhost:9090/targets (should show **UP**)
3. Generate test data → `python back-end/test_metrics.py`

### ❌ Docker not found

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully start
3. Try again

### ❌ Port already in use

**Solution:**
```bash
# Stop conflicting services
docker-compose down

# Or change ports in docker-compose.yml
ports:
  - "9091:9090"  # Change 9090 to 9091
```

---

## Architecture

```
┌─────────────────┐
│  Django App     │  Exposes /metrics endpoint
│  (Port 8000)    │  with Prometheus metrics
└────────┬────────┘
         │ scrapes every 15s
         ↓
┌─────────────────┐
│  Prometheus     │  Stores time-series data
│  (Port 9090)    │  Evaluates alert rules
└────────┬────────┘
         │ queries
         ↓
┌─────────────────┐
│  Grafana        │  Beautiful dashboards
│  (Port 3000)    │  Visualizations & alerts
└─────────────────┘
```

---

## Metrics Reference

### OTP Metrics
- `otp_sent_total` - Counter with labels: contact_type, status
- `otp_verify_total` - Counter with labels: contact_type, status
- `otp_verify_duration_seconds` - Histogram of latencies
- `active_verifications` - Gauge of concurrent verifications

### Order Metrics
- `order_created_total` - Counter with labels: payment_method, status
- `order_creation_duration_seconds` - Histogram of order processing time

### System Metrics
- `redis_errors_total` - Counter with label: operation
- `up` - Service health (1 = up, 0 = down)

---

## Sample Prometheus Queries

```promql
# Total OTP send rate
rate(otp_sent_total[5m])

# OTP success rate percentage
sum(rate(otp_sent_total{status="success"}[5m])) / sum(rate(otp_sent_total[5m])) * 100

# 95th percentile OTP latency
histogram_quantile(0.95, rate(otp_verify_duration_seconds_bucket[5m]))

# Order creation rate by payment method
sum by (payment_method) (rate(order_created_total[5m]))

# Failed order rate
rate(order_created_total{status!="success"}[5m])

# Redis error rate
rate(redis_errors_total[5m])
```

---

## Next Steps

1. ✅ Get monitoring running (you're doing this)
2. ⬜ Run your app and complete some checkouts
3. ⬜ Watch metrics appear in Grafana
4. ⬜ Customize dashboards for your needs
5. ⬜ Set up alerts (see MONITORING_SETUP_GUIDE.md)
6. ⬜ Plan production deployment

---

## Files You Need

All created in `monitoring/` directory:
- ✅ `docker-compose.yml` - Service definitions
- ✅ `start.bat` - Quick start script (Windows)
- ✅ `prometheus/prometheus.yml` - Prometheus config
- ✅ `prometheus/alerts.yml` - Alert rules
- ✅ `grafana/dashboards/luxe-market-overview.json` - Main dashboard

---

## Support

**Full documentation**: [MONITORING_SETUP_GUIDE.md](MONITORING_SETUP_GUIDE.md)

**Quick help**: [monitoring/README.md](monitoring/README.md)

**Test metrics**: Run `python back-end/test_metrics.py`

---

**Time to first dashboard**: ~5 minutes ⏱️

**Monitoring Level**: Production-ready 🚀
