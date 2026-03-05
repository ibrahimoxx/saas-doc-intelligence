"""
DocPilot AI — Core Middleware

RequestIdMiddleware: Adds a unique request_id to every request for log correlation.
"""

import uuid
import threading

_request_id = threading.local()


def get_request_id() -> str:
    """Get the current request ID from thread-local storage."""
    return getattr(_request_id, "value", "no-request-id")


class RequestIdMiddleware:
    """
    Middleware that generates a unique request_id per request.

    - Injects request_id into request object
    - Adds X-Request-Id response header
    - Makes request_id available via get_request_id() for logging
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Use incoming header if present, otherwise generate
        request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
        request.request_id = request_id
        _request_id.value = request_id

        response = self.get_response(request)
        response["X-Request-Id"] = request_id

        # Clean up thread-local
        _request_id.value = None

        return response
