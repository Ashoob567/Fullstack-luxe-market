#!/bin/bash
# Quick start script for Luxe Market monitoring

echo "==================================="
echo "Luxe Market - Monitoring Setup"
echo "==================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start monitoring stack
echo "Starting Prometheus and Grafana..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "Waiting for services to start..."
sleep 10

# Check if services are running
if docker ps | grep -q luxe-prometheus && docker ps | grep -q luxe-grafana; then
    echo ""
    echo "✅ Monitoring stack is ready!"
    echo ""
    echo "==================================="
    echo "Access Points:"
    echo "==================================="
    echo "📊 Grafana:    http://localhost:3000"
    echo "   Username:   admin"
    echo "   Password:   admin"
    echo ""
    echo "📈 Prometheus: http://localhost:9090"
    echo ""
    echo "📡 Django Metrics: http://localhost:8000/metrics"
    echo ""
    echo "==================================="
    echo "Next Steps:"
    echo "==================================="
    echo "1. Make sure Django is running: python manage.py runserver"
    echo "2. Open Grafana at http://localhost:3000"
    echo "3. Navigate to Dashboards → Luxe Market - Overview"
    echo ""
    echo "To stop: docker-compose down"
    echo "To view logs: docker-compose logs -f"
else
    echo ""
    echo "❌ Error: Services failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
