"""
DocPilot AI — Tenancy API URLs
"""

from django.urls import path

from apps.tenancy.api.views import (
    KnowledgeSpacesListView,
    MemberDetailView,
    MembersListView,
    MyPermissionsView,
    MyTenantsView,
    TenantDetailView,
    TenantSummaryView,
)

urlpatterns = [
    # My tenants
    path("", MyTenantsView.as_view(), name="tenants-list"),

    # Tenant detail
    path("<uuid:tenant_id>/", TenantDetailView.as_view(), name="tenant-detail"),
    path("<uuid:tenant_id>/summary/", TenantSummaryView.as_view(), name="tenant-summary"),

    # My permissions in tenant
    path("<uuid:tenant_id>/me/permissions/", MyPermissionsView.as_view(), name="tenant-permissions"),

    # Members
    path("<uuid:tenant_id>/members/", MembersListView.as_view(), name="tenant-members"),
    path("<uuid:tenant_id>/members/<uuid:member_id>/", MemberDetailView.as_view(), name="tenant-member-detail"),

    # Knowledge spaces
    path("<uuid:tenant_id>/spaces/", KnowledgeSpacesListView.as_view(), name="tenant-spaces"),
]
