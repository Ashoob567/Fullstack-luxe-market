"""
Structured logging configuration using structlog.

All logs are JSON-formatted with:
  - timestamp (ISO 8601)
  - level
  - logger name
  - request_id (from middleware)
  - event (message)
  - context fields (user_id, order_number, etc.)

Local dev: console with colors
Production: JSON to stdout → CloudWatch/DataDog
"""

import structlog
from django.conf import settings


def configure_logging():
    """Call this in settings.py after LOGGING is defined."""

    processors = [
        structlog.stdlib.filter_by_level,
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.DEBUG:
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
