"""
Prometheus metrics helpers.

Usage:
    from apps.core.monitoring import otp_sent_counter
    otp_sent_counter.labels(contact_type="email", status="success").inc()
"""

from prometheus_client import Counter, Histogram, Gauge

# OTP metrics
otp_sent_counter = Counter(
    "otp_sent_total",
    "Total OTP send attempts",
    ["contact_type", "status"],  # status: success | rate_limit | cooldown | failed
)

otp_verify_counter = Counter(
    "otp_verify_total",
    "Total OTP verification attempts",
    ["contact_type", "status"],  # status: success | invalid | locked | expired
)

otp_verify_latency = Histogram(
    "otp_verify_duration_seconds",
    "OTP verification latency",
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
)

# Order metrics
order_creation_counter = Counter(
    "order_created_total",
    "Total orders created",
    ["payment_method", "status"],  # status: success | payment_failed | validation_error
)

order_creation_latency = Histogram(
    "order_creation_duration_seconds",
    "Order creation latency (including payment)",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)

# System health
redis_errors_counter = Counter(
    "redis_errors_total",
    "Total Redis operation failures",
    ["operation"],  # operation: get | set | delete
)

active_verifications = Gauge(
    "active_verifications",
    "Number of in-progress OTP verifications",
)
