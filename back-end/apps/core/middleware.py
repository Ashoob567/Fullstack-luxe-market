"""
Request ID middleware for distributed tracing.

Generates a UUID for each request and:
  1. Attaches it to `request.request_id`
  2. Adds it to structlog context (appears in all logs)
  3. Returns it in `X-Request-ID` response header

Client can pass `X-Request-ID` to reuse an existing trace ID.
"""

import uuid
import structlog


class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.request_id = request_id

        # Add to structlog context (appears in all logs for this request)
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response
