"""
DocPilot AI — URL Configuration
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/auth/", include("apps.identity_access.api.urls")),
    path("api/v1/tenants/", include("apps.tenancy.api.urls")),
    path("api/v1/tenants/<uuid:tenant_id>/documents/", include("apps.documents.api.urls")),

    # Health check
    path("api/v1/health/", include("apps.core.urls")),
]
