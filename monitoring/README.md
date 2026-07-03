# Luxe Market Monitoring

Prometheus + Grafana monitoring setup for Luxe Market project.

## Quick Start

### Windows (Your Environment)

**1. Make sure Docker Desktop is running**

**2. Start monitoring stack:**
```bash
cd monitoring
start.bat
```

Or manually:
```bash
cd monitoring
docker-compose up -d
```

**3. Start Django backend:**
```bash
cd back-end
python manage.py runserver
```

**4. Access dashboards:**
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Django Metrics**: http://localhost:8000/metrics

**5. View Dashboard:**
- Open Grafana → Dashboards → "Luxe Market - Overview"

## What's Being Monitored

### OTP Metrics
- Send rate by contact type (email/phone)
- Success rate
- Verification latency (p50, p95, p99)
- Active verification count

### Order Metrics
- Order creation rate
- Success rate by payment method
- Order creation latency

### System Health
- Redis error rates
- Application uptime

## Files Structure

```
monitoring/
├── docker-compose.yml              # Docker services config
├── start.bat                       # Quick start script (Windows)
├── start.sh                        # Quick start script (Linux/Mac)
├── prometheus/
│   ├── prometheus.yml              # Prometheus config
│   └── alerts.yml                  # Alert rules
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── prometheus.yml      # Auto-config Prometheus data source
    │   └── dashboards/
    │       └── default.yml         # Auto-load dashboards
    └── dashboards/
        └── luxe-market-overview.json  # Main dashboard
```

## Useful Commands

```bash
# Start monitoring
docker-compose up -d

# Stop monitoring
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop and remove all data
docker-compose down -v
```

## Troubleshooting

### Django metrics not showing

1. Check Django is running: `curl http://localhost:8000/metrics`
2. Check Prometheus targets: http://localhost:9090/targets
   - Should show `luxe-market-django` as **UP**

### Grafana shows "No data"

1. Verify Prometheus data source: Settings → Data Sources → Prometheus
2. Check it's connected to `http://prometheus:9090`
3. Test with a simple query: `up{job="luxe-market-django"}`

### Docker permission errors

Run as administrator or give permissions:
```bash
icacls . /grant Users:F /T
```

## Production Deployment

See [MONITORING_SETUP_GUIDE.md](../MONITORING_SETUP_GUIDE.md) for:
- Security hardening
- HTTPS setup
- Alert notifications
- Retention policies

## Links

- 📘 Full Setup Guide: [MONITORING_SETUP_GUIDE.md](../MONITORING_SETUP_GUIDE.md)
- 🐳 Docker Compose Docs: https://docs.docker.com/compose/
- 📊 Prometheus Docs: https://prometheus.io/docs/
- 📈 Grafana Docs: https://grafana.com/docs/
