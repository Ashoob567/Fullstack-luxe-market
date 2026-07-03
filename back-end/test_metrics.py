"""
Test script to generate sample metrics for monitoring.

Usage: python test_metrics.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.monitoring import (
    otp_sent_counter,
    otp_verify_counter,
    otp_verify_latency,
    order_creation_counter,
    order_creation_latency,
    redis_errors_counter,
    active_verifications
)
import time
import random


def generate_otp_metrics():
    """Generate sample OTP metrics"""
    print("Generating OTP metrics...")

    # Simulate successful OTP sends
    for _ in range(10):
        otp_sent_counter.labels(contact_type="email", status="success").inc()

    for _ in range(5):
        otp_sent_counter.labels(contact_type="phone", status="success").inc()

    # Simulate some failures
    otp_sent_counter.labels(contact_type="email", status="rate_limit").inc(2)
    otp_sent_counter.labels(contact_type="phone", status="failed").inc(1)

    # Simulate OTP verifications
    for _ in range(8):
        otp_verify_counter.labels(contact_type="email", status="success").inc()
        # Simulate latency
        latency = random.uniform(0.05, 0.3)
        otp_verify_latency.observe(latency)

    otp_verify_counter.labels(contact_type="email", status="invalid").inc(2)
    otp_verify_counter.labels(contact_type="phone", status="expired").inc(1)

    # Set active verifications
    active_verifications.set(random.randint(0, 5))

    print("✅ OTP metrics generated")


def generate_order_metrics():
    """Generate sample order metrics"""
    print("Generating Order metrics...")

    # Simulate successful orders
    for _ in range(15):
        order_creation_counter.labels(payment_method="cod", status="success").inc()
        # Simulate order creation latency (0.5 - 3.0 seconds)
        latency = random.uniform(0.5, 3.0)
        order_creation_latency.observe(latency)

    for _ in range(8):
        order_creation_counter.labels(payment_method="card", status="success").inc()
        latency = random.uniform(1.0, 4.0)
        order_creation_latency.observe(latency)

    # Simulate some failures
    order_creation_counter.labels(payment_method="card", status="payment_failed").inc(2)
    order_creation_counter.labels(payment_method="cod", status="validation_error").inc(1)

    print("✅ Order metrics generated")


def generate_redis_metrics():
    """Generate sample Redis metrics"""
    print("Generating Redis metrics...")

    # Simulate Redis errors (should be rare)
    redis_errors_counter.labels(operation="get").inc(1)

    print("✅ Redis metrics generated")


def main():
    print("=" * 50)
    print("Luxe Market - Metrics Test Generator")
    print("=" * 50)
    print()

    # Generate metrics
    generate_otp_metrics()
    generate_order_metrics()
    generate_redis_metrics()

    print()
    print("=" * 50)
    print("✅ All metrics generated successfully!")
    print("=" * 50)
    print()
    print("Check metrics at: http://localhost:8000/metrics")
    print("View in Prometheus: http://localhost:9090/graph")
    print("View in Grafana: http://localhost:3000")
    print()
    print("Sample queries to try in Prometheus:")
    print("  - otp_sent_total")
    print("  - rate(otp_sent_total[5m])")
    print("  - order_created_total")
    print("  - histogram_quantile(0.95, rate(order_creation_duration_seconds_bucket[5m]))")
    print()


if __name__ == "__main__":
    main()
