"""
DocPilot AI — Core Permissions

Reusable permission classes for tenant-scoped access control.
"""

from rest_framework import permissions


class IsTenantMember(permissions.BasePermission):
    """
    Permission: user must be an active member of the tenant
    specified in the URL (tenant_id).

    Expects the view to have a `kwargs['tenant_id']` from the URL.
    """

    message = "Vous n'êtes pas membre de cette organisation."

    def has_permission(self, request, view):
        tenant_id = view.kwargs.get("tenant_id")
        if not tenant_id:
            return False

        if not request.user or not request.user.is_authenticated:
            return False

        # Check membership (imported here to avoid circular imports)
        from apps.tenancy.models import TenantMembership

        return TenantMembership.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            status="active",
        ).exists()


class IsTenantAdmin(permissions.BasePermission):
    """
    Permission: user must be owner or admin of the tenant.
    """

    message = "Accès réservé aux administrateurs de l'organisation."

    def has_permission(self, request, view):
        tenant_id = view.kwargs.get("tenant_id")
        if not tenant_id:
            return False

        if not request.user or not request.user.is_authenticated:
            return False

        from apps.tenancy.models import TenantMembership

        return TenantMembership.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            role__in=["owner", "admin"],
            status="active",
        ).exists()


class IsTenantManager(permissions.BasePermission):
    """
    Permission: user must be owner, admin, or manager of the tenant.
    Managers can upload documents and view admin stats.
    """

    message = "Accès réservé aux gestionnaires de l'organisation."

    def has_permission(self, request, view):
        tenant_id = view.kwargs.get("tenant_id")
        if not tenant_id:
            return False

        if not request.user or not request.user.is_authenticated:
            return False

        from apps.tenancy.models import TenantMembership

        return TenantMembership.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            role__in=["owner", "admin", "manager"],
            status="active",
        ).exists()


def get_user_tenant_role(user, tenant_id) -> str | None:
    """
    Get the user's role in a specific tenant.
    Returns None if user is not a member.
    """
    from apps.tenancy.models import TenantMembership

    membership = TenantMembership.objects.filter(
        tenant_id=tenant_id,
        user=user,
        status="active",
    ).first()

    return membership.role if membership else None
