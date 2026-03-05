"""
DocPilot AI — Core URLs

Health check endpoint.
"""

from django.http import JsonResponse
from django.urls import path


def health_check(request):
    """Simple health check endpoint."""
    return JsonResponse({"status": "ok", "service": "docpilot-api"})


urlpatterns = [
    path("", health_check, name="health-check"),
]
