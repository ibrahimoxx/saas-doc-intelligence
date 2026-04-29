"""
DocPilot AI — Tenancy API URLs
"""

from django.urls import path

from apps.tenancy.api.views import (
    KnowledgeSpaceDetailView,
    KnowledgeSpacesListView,
    MemberDetailView,
    MembersListView,
    MyPermissionsView,
    MyTenantsView,
    SpaceProfileDetailView,
    SpaceProfileListView,
    TenantDetailView,
    TenantSummaryView,
    UserSpaceAccessView,
    UserSpaceProfileView,
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

    # User direct space access
    path(
        "<uuid:tenant_id>/members/<uuid:member_id>/space-access/",
        UserSpaceAccessView.as_view(),
        name="user-space-access",
    ),
    path(
        "<uuid:tenant_id>/members/<uuid:member_id>/space-access/<uuid:space_id>/",
        UserSpaceAccessView.as_view(),
        name="user-space-access-detail",
    ),

    # User space profile assignments
    path(
        "<uuid:tenant_id>/members/<uuid:member_id>/space-profiles/",
        UserSpaceProfileView.as_view(),
        name="user-space-profiles",
    ),
    path(
        "<uuid:tenant_id>/members/<uuid:member_id>/space-profiles/<uuid:profile_id>/",
        UserSpaceProfileView.as_view(),
        name="user-space-profile-detail",
    ),

    # Knowledge spaces (list + create)
    path("<uuid:tenant_id>/spaces/", KnowledgeSpacesListView.as_view(), name="tenant-spaces"),

    # Knowledge space detail (GET detail, PATCH update, DELETE soft-delete)
    path("<uuid:tenant_id>/spaces/<uuid:space_id>/", KnowledgeSpaceDetailView.as_view(), name="tenant-space-detail"),

    # Space access profiles
    path("<uuid:tenant_id>/space-profiles/", SpaceProfileListView.as_view(), name="space-profiles"),
    path(
        "<uuid:tenant_id>/space-profiles/<uuid:profile_id>/",
        SpaceProfileDetailView.as_view(),
        name="space-profile-detail",
    ),
]
