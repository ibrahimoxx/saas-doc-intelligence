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


class IsTenantOwner(permissions.BasePermission):
    """
    Permission: user must be the owner of the tenant (not just admin).
    Used for operations only owners can perform, e.g. granting admin role.
    Super owners (is_superuser=True) always pass.
    """

    message = "Accès réservé au propriétaire de l'organisation."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        tenant_id = view.kwargs.get("tenant_id")
        if not tenant_id:
            return False

        from apps.tenancy.models import TenantMembership

        return TenantMembership.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            role="owner",
            status="active",
        ).exists()


class IsSuperOwner(permissions.BasePermission):
    """
    Permission: user must be a platform super owner (is_superuser=True).
    Used for platform-wide admin operations.
    """

    message = "Accès réservé aux super administrateurs de la plateforme."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


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


def user_can_access_space(user, tenant_id, space_id) -> bool:
    """
    Return True if user is allowed to access the given knowledge space.

    Rules (in order):
    1. Must be an active tenant member.
    2. Admins and owners always bypass — they see all spaces.
    3. Members need either a direct grant OR a profile that includes the space.
       No grants = no access. ACL is always enforced.
    """
    from apps.core.constants import TenantRole
    from apps.tenancy.models import TenantMembership, UserSpaceAccess, UserSpaceProfile

    membership = TenantMembership.objects.filter(
        tenant_id=tenant_id, user=user, status="active"
    ).first()

    if not membership:
        return False

    if membership.role in TenantRole.ADMIN_ROLES:
        return True

    if UserSpaceAccess.objects.filter(
        tenant_id=tenant_id, user=user, space_id=space_id
    ).exists():
        return True

    return UserSpaceProfile.objects.filter(
        tenant_id=tenant_id, user=user, profile__spaces__id=space_id
    ).exists()


def get_accessible_spaces(user, tenant_id):
    """
    Return a QuerySet of KnowledgeSpace the user can access in this tenant.

    Admins/owners get all active spaces.
    Members get only spaces they have a direct grant or profile grant for.
    No grants = empty queryset. ACL is always enforced.
    """
    from apps.core.constants import TenantRole
    from apps.tenancy.models import (
        KnowledgeSpace,
        TenantMembership,
        UserSpaceAccess,
        UserSpaceProfile,
    )

    membership = TenantMembership.objects.filter(
        tenant_id=tenant_id, user=user, status="active"
    ).first()

    if not membership:
        return KnowledgeSpace.objects.none()

    if membership.role in TenantRole.ADMIN_ROLES:
        return KnowledgeSpace.objects.filter(tenant_id=tenant_id, is_active=True)

    direct_ids = UserSpaceAccess.objects.filter(
        tenant_id=tenant_id, user=user
    ).values_list("space_id", flat=True)

    profile_ids = UserSpaceProfile.objects.filter(
        tenant_id=tenant_id, user=user
    ).values_list("profile__spaces__id", flat=True)

    space_ids = set(direct_ids) | set(filter(None, profile_ids))
    return KnowledgeSpace.objects.filter(id__in=space_ids, is_active=True)
