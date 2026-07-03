# Monitoring Setup Guide - Prometheus + Grafana

Complete guide to set up monitoring for Luxe Market project.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Step 1: Install Prometheus](#step-1-install-prometheus)
4. [Step 2: Configure Prometheus](#step-2-configure-prometheus)
5. [Step 3: Install Grafana](#step-3-install-grafana)
6. [Step 4: Configure Grafana](#step-4-configure-grafana)
7. [Step 5: Create Dashboards](#step-5-create-dashboards)
8. [Step 6: Set Up Alerts](#step-6-set-up-alerts)
9. [Testing](#testing)
10. [Production Deployment](#production-deployment)

---

## Overview

**What you'll set up:**
- ✅ Prometheus server (scrapes metrics from Django)
- ✅ Grafana dashboards (visualizes metrics)
- ✅ Pre-built dashboards for OTP, Orders, Redis
- ✅ Alert rules for critical issues

**Architecture:**
```
Django App (:8000/metrics) 
    ↓ (scrapes every 15s)
Prometheus (:9090)
    ↓ (queries)
Grafana (:3000)
    → Beautiful Dashboards
```

---

## Requirements

### Windows (Your Environment)

**Option A: Docker (Recommended)**
- Docker Desktop installed
- 2GB free disk space

**Option B: Native Installation**
- Windows 10/11
- 1GB free disk space
- Admin privileges

---

## Step 1: Install Prometheus

### Option A: Docker (Recommended)

**1.1 Create Prometheus config directory**
```bash
cd c:\python_projects\luxe-market-project
mkdir monitoring
cd monitoring
mkdir prometheus grafana
```

**1.2 Download Prometheus**
Already handled in docker-compose (see Step 2)

### Option B: Native Windows Installation

**1.1 Download Prometheus**
1. Go to: https://prometheus.io/download/
2. Download: `prometheus-X.XX.X.windows-amd64.zip`
3. Extract to: `C:\prometheus`

**1.2 Test Installation**
```bash
cd C:\prometheus
.\prometheus.exe --version
```

---

## Step 2: Configure Prometheus

**2.1 Create Prometheus config file**

Create: `monitoring/prometheus/prometheus.yml`

```yaml
# Prometheus configuration for Luxe Market
global:
  scrape_interval: 15s       # Scrape metrics every 15 seconds
  evaluation_interval: 15s   # Evaluate rules every 15 seconds
  external_labels:
    cluster: 'luxe-market'
    environment: 'development'

# Alert manager (optional - for Step 6)
# alerting:
#   alertmanagers:
#     - static_configs:
#         - targets:
#           - localhost:9093

# Rule files (for alerts)
rule_files:
  - 'alerts.yml'

# Scrape configurations
scrape_configs:
  # Django application metrics
  - job_name: 'luxe-market-django'
    static_configs:
      - targets: ['host.docker.internal:8000']  # For Docker
        # For native: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

**2.2 Create Alert Rules**

Create: `monitoring/prometheus/alerts.yml`

```yaml
# Alert rules for Luxe Market
groups:
  - name: luxe_market_alerts
    interval: 30s
    rules:
      # OTP Service Alerts
      - alert: HighOTPFailureRate
        expr: |
          (
            sum(rate(otp_sent_total{status!="success"}[5m])) /
            sum(rate(otp_sent_total[5m]))
          ) > 0.1
        for: 5m
        labels:
          severity: warning
          component: otp
        annotations:
          summary: "High OTP failure rate detected"
          description: "OTP failure rate is {{ $value | humanizePercentage }} over the last 5 minutes"

      - alert: OTPVerificationTooSlow
        expr: |
          histogram_quantile(0.95, 
            rate(otp_verify_duration_seconds_bucket[5m])
          ) > 1.0
        for: 3m
        labels:
          severity: warning
          component: otp
        annotations:
          summary: "OTP verification is slow"
          description: "95th percentile OTP verification latency is {{ $value }}s"

      # Order Service Alerts
      - alert: HighOrderFailureRate
        expr: |
          (
            sum(rate(order_created_total{status!="success"}[10m])) /
            sum(rate(order_created_total[10m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          component: orders
        annotations:
          summary: "High order failure rate"
          description: "{{ $value | humanizePercentage }} of orders are failing"

      - alert: SlowOrderCreation
        expr: |
          histogram_quantile(0.95,
            rate(order_creation_duration_seconds_bucket[5m])
          ) > 5.0
        for: 5m
        labels:
          severity: warning
          component: orders
        annotations:
          summary: "Order creation is slow"
          description: "95th percentile order creation time is {{ $value }}s"

      # Redis Health Alerts
      - alert: RedisErrors
        expr: rate(redis_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
          component: redis
        annotations:
          summary: "Redis errors detected"
          description: "Redis is experiencing {{ $value }} errors per second"

      # Application Health
      - alert: DjangoDown
        expr: up{job="luxe-market-django"} == 0
        for: 1m
        labels:
          severity: critical
          component: django
        annotations:
          summary: "Django application is down"
          description: "Django /metrics endpoint is unreachable"
```

**2.3 Create Docker Compose file**

Create: `monitoring/docker-compose.yml`

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: luxe-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=15d'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: luxe-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

---

## Step 3: Install Grafana

### Docker Method (Already in docker-compose above)

**3.1 Create Grafana provisioning directory**
```bash
cd c:\python_projects\luxe-market-project\monitoring
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards
mkdir grafana/dashboards
```

**3.2 Configure Grafana data source**

Create: `monitoring/grafana/provisioning/datasources/prometheus.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
      queryTimeout: 60s
      httpMethod: POST
```

**3.3 Configure dashboard provisioning**

Create: `monitoring/grafana/provisioning/dashboards/default.yml`

```yaml
apiVersion: 1

providers:
  - name: 'Luxe Market Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

---

## Step 4: Start Monitoring Stack

**4.1 Start Django application**
```bash
cd c:\python_projects\luxe-market-project\back-end
python manage.py runserver
```

Verify metrics endpoint:
- Open: http://localhost:8000/metrics
- You should see Prometheus metrics

**4.2 Start Prometheus & Grafana**
```bash
cd c:\python_projects\luxe-market-project\monitoring
docker-compose up -d
```

**4.3 Verify services**
```bash
# Check containers are running
docker ps

# You should see:
# luxe-prometheus  (port 9090)
# luxe-grafana     (port 3000)
```

**4.4 Access dashboards**
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

---

## Step 5: Create Grafana Dashboards

### Dashboard 1: OTP Service Monitoring

Create: `monitoring/grafana/dashboards/otp-dashboard.json`

```json
{
  "dashboard": {
    "title": "OTP Service Monitoring",
    "tags": ["otp", "authentication"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "OTP Send Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(otp_sent_total[5m])",
            "legendFormat": "{{contact_type}} - {{status}}"
          }
        ],
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8}
      },
      {
        "id": 2,
        "title": "OTP Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(otp_sent_total{status=\"success\"}[5m])) / sum(rate(otp_sent_total[5m])) * 100"
          }
        ],
        "gridPos": {"x": 12, "y": 0, "w": 6, "h": 4}
      },
      {
        "id": 3,
        "title": "OTP Verification Latency (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(otp_verify_duration_seconds_bucket[5m]))"
          }
        ],
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8}
      },
      {
        "id": 4,
        "title": "Active Verifications",
        "type": "stat",
        "targets": [
          {
            "expr": "active_verifications"
          }
        ],
        "gridPos": {"x": 12, "y": 4, "w": 6, "h": 4}
      }
    ]
  }
}
```

### Dashboard 2: Order Service Monitoring

Create: `monitoring/grafana/dashboards/orders-dashboard.json`

```json
{
  "dashboard": {
    "title": "Order Service Monitoring",
    "tags": ["orders", "payments"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Order Creation Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(order_created_total[5m])",
            "legendFormat": "{{payment_method}} - {{status}}"
          }
        ],
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8}
      },
      {
        "id": 2,
        "title": "Order Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(order_created_total{status=\"success\"}[5m])) / sum(rate(order_created_total[5m])) * 100"
          }
        ],
        "gridPos": {"x": 12, "y": 0, "w": 6, "h": 4}
      },
      {
        "id": 3,
        "title": "Order Creation Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(order_creation_duration_seconds_bucket[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(order_creation_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(order_creation_duration_seconds_bucket[5m]))",
            "legendFormat": "p99"
          }
        ],
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8}
      }
    ]
  }
}
```

### Dashboard 3: System Health

Create: `monitoring/grafana/dashboards/system-health.json`

```json
{
  "dashboard": {
    "title": "System Health",
    "tags": ["infrastructure", "redis"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Redis Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(redis_errors_total[5m])",
            "legendFormat": "{{operation}}"
          }
        ],
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8}
      },
      {
        "id": 2,
        "title": "Application Uptime",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"luxe-market-django\"}"
          }
        ],
        "gridPos": {"x": 12, "y": 0, "w": 6, "h": 4}
      }
    ]
  }
}
```

---

## Step 6: Import Dashboards to Grafana

### Method 1: Auto-provisioning (Recommended)

The dashboards will automatically load when Grafana starts if placed in:
`monitoring/grafana/dashboards/`

### Method 2: Manual Import

1. Open Grafana: http://localhost:3000
2. Login: admin / admin
3. Click **+ → Import**
4. Copy-paste the JSON from the dashboard files above
5. Click **Load** → **Import**

---

## Testing

### Test 1: Verify Metrics Collection

**1. Check Django metrics endpoint**
```bash
curl http://localhost:8000/metrics
```

Expected output:
```
# HELP otp_sent_total Total OTP send attempts
# TYPE otp_sent_total counter
otp_sent_total{contact_type="email",status="success"} 42.0
...
```

**2. Check Prometheus is scraping**
- Open: http://localhost:9090
- Go to: **Status → Targets**
- Verify: `luxe-market-django` status is **UP**

**3. Query metrics in Prometheus**
- Go to: http://localhost:9090/graph
- Try query: `otp_sent_total`
- Click **Execute** → **Graph**

### Test 2: Generate Test Metrics

**Run checkout flow to generate metrics:**
```bash
# In your front-end, complete a checkout
# This will increment:
# - otp_sent_total
# - otp_verify_total
# - order_created_total
```

**Or use Django shell:**
```python
from apps.core.monitoring import otp_sent_counter, order_creation_counter

# Simulate OTP metrics
otp_sent_counter.labels(contact_type="email", status="success").inc(10)
otp_sent_counter.labels(contact_type="phone", status="rate_limit").inc(2)

# Simulate order metrics
order_creation_counter.labels(payment_method="cod", status="success").inc(5)
```

### Test 3: View in Grafana

1. Open: http://localhost:3000
2. Navigate to **Dashboards**
3. Open: "OTP Service Monitoring"
4. You should see metrics visualized

---

## Production Deployment

### Security Checklist

**1. Restrict /metrics endpoint**

Edit: `back-end/config/urls.py`

```python
from django.http import HttpResponseForbidden

def prometheus_metrics(request):
    """Expose Prometheus metrics at /metrics (internal only)"""
    # Only allow from internal IPs
    allowed_ips = ['127.0.0.1', '::1', '10.0.0.0/8']  # Add your Prometheus server IP
    
    client_ip = request.META.get('REMOTE_ADDR')
    if client_ip not in allowed_ips:
        return HttpResponseForbidden("Access denied")
    
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
```

**2. Secure Grafana**

Edit: `monitoring/docker-compose.yml`

```yaml
grafana:
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}  # Use env variable
    - GF_SERVER_ROOT_URL=https://grafana.yourdomain.com
    - GF_AUTH_ANONYMOUS_ENABLED=false
```

**3. Enable HTTPS**

Use reverse proxy (nginx/Caddy) with SSL:
```nginx
server {
    listen 443 ssl;
    server_name grafana.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

**4. Set retention policies**

Already configured in docker-compose:
```yaml
command:
  - '--storage.tsdb.retention.time=15d'  # Keep 15 days of data
```

---

## Troubleshooting

### Issue: Prometheus can't reach Django

**Solution for Docker:**
```yaml
# Use host.docker.internal instead of localhost
targets: ['host.docker.internal:8000']
```

**Solution for native:**
```yaml
targets: ['localhost:8000']
```

### Issue: No metrics showing in Grafana

**Check:**
1. Django is running: `curl http://localhost:8000/metrics`
2. Prometheus is scraping: http://localhost:9090/targets
3. Prometheus has data: Query `otp_sent_total` in Prometheus UI
4. Grafana data source is connected: Settings → Data Sources

### Issue: Permission denied on Windows

```bash
# Run Docker Desktop as Administrator
# Or give permissions to monitoring folder
icacls monitoring /grant Users:F /T
```

---

## Useful Commands

```bash
# View Prometheus logs
docker logs luxe-prometheus

# View Grafana logs
docker logs luxe-grafana

# Restart monitoring stack
docker-compose restart

# Stop monitoring stack
docker-compose down

# Stop and remove data
docker-compose down -v

# Reload Prometheus config (without restart)
curl -X POST http://localhost:9090/-/reload
```

---

## Next Steps

1. ✅ Set up monitoring (you're doing this now)
2. ⬜ Create custom dashboards for your KPIs
3. ⬜ Set up AlertManager for email/Slack notifications
4. ⬜ Add more metrics (cart operations, product views, etc.)
5. ⬜ Set up log aggregation (ELK or Loki)
6. ⬜ Deploy to production with proper security

---

## Resources

- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **PromQL Guide**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Dashboard Library**: https://grafana.com/grafana/dashboards/

---

## Questions?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all services are running: `docker ps`
3. Check logs: `docker logs <container-name>`
4. Ensure Django metrics endpoint is accessible

---

**Last Updated**: 2026-07-04
**Author**: Claude Code
**Project**: Luxe Market Monitoring Setup
