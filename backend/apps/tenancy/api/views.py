"""
DocPilot AI — Tenancy API Views
"""

import logging

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction, MembershipStatus, TenantRole
from apps.core.permissions import IsTenantAdmin, IsTenantMember, get_accessible_spaces
from apps.identity_access.models import User
from apps.tenancy.api.serializers import (
    InvitationAcceptSerializer,
    InviteMemberSerializer,
    KnowledgeSpaceCreateSerializer,
    KnowledgeSpaceSerializer,
    SpaceAccessProfileCreateSerializer,
    SpaceAccessProfileSerializer,
    TenantCreateSerializer,
    TenantMemberSerializer,
    TenantMembershipSerializer,
    TenantPermissionsSerializer,
    TenantSerializer,
    UpdateMemberRoleSerializer,
    UserInvitationSerializer,
    UserSpaceAccessSerializer,
    UserSpaceProfileSerializer,
)
from apps.tenancy.models import (
    KnowledgeSpace,
    SpaceAccessProfile,
    Tenant,
    TenantMembership,
    UserInvitation,
    UserSpaceAccess,
    UserSpaceProfile,
)
from apps.tenancy.services import send_invitation_email
from apps.documents.models import Document
from apps.conversations.models import Conversation

logger = logging.getLogger("apps.tenancy")


# ===========================
# My Tenants
# ===========================

class MyTenantsView(APIView):
    """
    GET  /api/v1/tenants/          — List tenants I belong to
    POST /api/v1/tenants/          — Create a new tenant (I become owner)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        memberships = TenantMembership.objects.filter(
            user=request.user,
            status="active",
        ).select_related("tenant")

        serializer = TenantMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TenantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()

        # Creator becomes owner
        TenantMembership.objects.create(
            tenant=tenant,
            user=request.user,
            role=TenantRole.OWNER,
            status="active",
        )

        # Create default knowledge space
        KnowledgeSpace.objects.create(
            tenant=tenant,
            name="Général",
            slug="general",
            description="Espace de connaissance par défaut",
            created_by=request.user,
        )

        logger.info(
            "Tenant created",
            extra={"tenant_id": str(tenant.id), "user_id": str(request.user.id)},
        )

        return Response(TenantSerializer(tenant).data, status=status.HTTP_201_CREATED)


# ===========================
# Tenant Detail
# ===========================

class TenantDetailView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/  — Get tenant details
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Organisation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(TenantSerializer(tenant).data)


# ===========================
# My Permissions in Tenant
# ===========================

class MyPermissionsView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/me/permissions/

    Returns current user's role and computed permissions.
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        membership = TenantMembership.objects.get(
            tenant_id=tenant_id,
            user=request.user,
            status="active",
        )

        role = membership.role
        accessible_spaces = get_accessible_spaces(request.user, tenant_id)
        permissions_data = {
            "role": role,
            "can_upload": role in TenantRole.MANAGER_ROLES,
            "can_delete_documents": role in TenantRole.MANAGER_ROLES,
            "can_manage_members": role in TenantRole.ADMIN_ROLES,
            "can_view_admin": role in TenantRole.MANAGER_ROLES,
            "accessible_space_ids": list(accessible_spaces.values_list("id", flat=True)),
        }

        serializer = TenantPermissionsSerializer(permissions_data)
        return Response(serializer.data)


# ===========================
# Members
# ===========================

class MembersListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/members/       — List all members
    POST /api/v1/tenants/{tenant_id}/members/       — Invite a member (admin only)
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        members = TenantMembership.objects.filter(
            tenant_id=tenant_id,
        ).select_related("user").order_by("-created_at")

        serializer = TenantMemberSerializer(members, many=True)
        return Response(serializer.data)

    def post(self, request, tenant_id):
        # Check admin permission for invite
        membership = TenantMembership.objects.get(
            tenant_id=tenant_id, user=request.user, status="active"
        )
        if membership.role not in TenantRole.ADMIN_ROLES:
            return Response(
                {"error": {"code": "forbidden", "message": "Seuls les admins peuvent inviter des membres."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        role = serializer.validated_data["role"]

        # Find or indicate user doesn't exist
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": {"code": "user_not_found", "message": f"Aucun utilisateur trouvé avec l'email {email}."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already member
        if TenantMembership.objects.filter(tenant_id=tenant_id, user=user).exists():
            return Response(
                {"error": {"code": "already_member", "message": "Cet utilisateur est déjà membre."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cannot assign owner role via invite
        if role == "owner":
            return Response(
                {"error": {"code": "invalid_role", "message": "Le rôle 'owner' ne peut pas être assigné."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_membership = TenantMembership.objects.create(
            tenant_id=tenant_id,
            user=user,
            role=role,
            status="active",
        )

        logger.info(
            "Member added",
            extra={
                "tenant_id": tenant_id,
                "invited_user_id": str(user.id),
                "role": role,
                "by_user_id": str(request.user.id),
            },
        )

        return Response(TenantMemberSerializer(new_membership).data, status=status.HTTP_201_CREATED)


class MemberDetailView(APIView):
    """
    PATCH  /api/v1/tenants/{tenant_id}/members/{member_id}/  — Update role
    DELETE /api/v1/tenants/{tenant_id}/members/{member_id}/  — Remove member
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def patch(self, request, tenant_id, member_id):
        try:
            target_membership = TenantMembership.objects.get(id=member_id, tenant_id=tenant_id)
        except TenantMembership.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        update_fields = []

        # --- Role change ---
        if "role" in serializer.validated_data:
            # Cannot change owner's role
            if target_membership.role == TenantRole.OWNER:
                return Response(
                    {"error": {"code": "forbidden", "message": "Le rôle du propriétaire ne peut pas être modifié."}},
                    status=status.HTTP_403_FORBIDDEN,
                )

            new_role = serializer.validated_data["role"]

            # Only owner or super owner can grant or revoke admin
            if new_role == TenantRole.ADMIN or target_membership.role == TenantRole.ADMIN:
                caller_is_owner = request.user.is_superuser or TenantMembership.objects.filter(
                    tenant_id=tenant_id,
                    user=request.user,
                    role=TenantRole.OWNER,
                    status="active",
                ).exists()
                if not caller_is_owner:
                    return Response(
                        {"error": {"code": "forbidden", "message": "Seul le propriétaire peut accorder ou retirer le rôle d'administrateur."}},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            old_role = target_membership.role
            target_membership.role = new_role
            update_fields.append("role")

            log_action(
                action=AuditAction.ROLE_GRANTED if new_role > old_role else AuditAction.ROLE_REVOKED,
                user=request.user,
                tenant_id=tenant_id,
                resource_type="membership",
                resource_id=str(member_id),
                details={"old_role": old_role, "new_role": new_role},
            )

        # --- Status change ---
        if "status" in serializer.validated_data:
            # Cannot modify your own membership status
            if target_membership.user == request.user:
                return Response(
                    {"error": {"code": "forbidden", "message": "Vous ne pouvez pas modifier votre propre statut."}},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Cannot disable the owner
            if target_membership.role == TenantRole.OWNER:
                return Response(
                    {"error": {"code": "forbidden", "message": "Le statut du propriétaire ne peut pas être modifié."}},
                    status=status.HTTP_403_FORBIDDEN,
                )

            new_status = serializer.validated_data["status"]
            old_status = target_membership.status
            target_membership.status = new_status
            update_fields.append("status")

            log_action(
                action=AuditAction.MEMBERSHIP_DISABLED,
                user=request.user,
                tenant_id=tenant_id,
                resource_type="membership",
                resource_id=str(member_id),
                details={"old_status": old_status, "new_status": new_status, "target_user": str(target_membership.user.id)},
            )

        if update_fields:
            target_membership.save(update_fields=update_fields + ["updated_at"])

        logger.info(
            "Member updated",
            extra={
                "tenant_id": str(tenant_id),
                "member_id": str(member_id),
                "updated_fields": update_fields,
                "by_user_id": str(request.user.id),
            },
        )

        return Response(TenantMemberSerializer(target_membership).data)

    def delete(self, request, tenant_id, member_id):
        try:
            target_membership = TenantMembership.objects.get(id=member_id, tenant_id=tenant_id)
        except TenantMembership.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Cannot remove owner
        if target_membership.role == TenantRole.OWNER:
            return Response(
                {"error": {"code": "forbidden", "message": "Le propriétaire ne peut pas être retiré."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Cannot remove yourself
        if target_membership.user == request.user:
            return Response(
                {"error": {"code": "forbidden", "message": "Vous ne pouvez pas vous retirer vous-même."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        logger.info(
            "Member removed",
            extra={
                "tenant_id": tenant_id,
                "removed_user_id": str(target_membership.user.id),
                "by_user_id": str(request.user.id),
            },
        )

        target_membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ===========================
# Knowledge Spaces
# ===========================

class KnowledgeSpacesListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/spaces/      — List knowledge spaces
    POST /api/v1/tenants/{tenant_id}/spaces/      — Create a knowledge space (manager+)
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        spaces = get_accessible_spaces(request.user, tenant_id).order_by("name")
        serializer = KnowledgeSpaceSerializer(spaces, many=True)
        return Response(serializer.data)

    def post(self, request, tenant_id):
        # Check manager permission
        membership = TenantMembership.objects.get(
            tenant_id=tenant_id, user=request.user, status="active"
        )
        if membership.role not in TenantRole.MANAGER_ROLES:
            return Response(
                {"error": {"code": "forbidden", "message": "Seuls les gestionnaires peuvent créer des espaces."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = KnowledgeSpaceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check slug uniqueness within tenant
        slug = serializer.validated_data["slug"]
        if KnowledgeSpace.objects.filter(tenant_id=tenant_id, slug=slug).exists():
            return Response(
                {"error": {"code": "duplicate_slug", "message": "Ce slug existe déjà dans cette organisation."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        space = serializer.save(tenant_id=tenant_id, created_by=request.user)

        logger.info(
            "Knowledge space created",
            extra={"tenant_id": tenant_id, "space_id": str(space.id)},
        )

        return Response(KnowledgeSpaceSerializer(space).data, status=status.HTTP_201_CREATED)


# ===========================
# Knowledge Space Detail
# ===========================

class KnowledgeSpaceDetailView(APIView):
    """
    GET    /api/v1/tenants/{tenant_id}/spaces/{space_id}/  — Space details (any member)
    PATCH  /api/v1/tenants/{tenant_id}/spaces/{space_id}/  — Update name/description (manager+)
    DELETE /api/v1/tenants/{tenant_id}/spaces/{space_id}/  — Soft-delete (admin+)
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def _get_space(self, tenant_id, space_id):
        try:
            return KnowledgeSpace.objects.get(id=space_id, tenant_id=tenant_id, is_active=True)
        except KnowledgeSpace.DoesNotExist:
            return None

    def get(self, request, tenant_id, space_id):
        space = self._get_space(tenant_id, space_id)
        if not space:
            return Response(
                {"error": {"code": "not_found", "message": "Espace non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(KnowledgeSpaceSerializer(space).data)

    def patch(self, request, tenant_id, space_id):
        membership = TenantMembership.objects.filter(
            tenant_id=tenant_id, user=request.user, status="active"
        ).first()
        if not membership or membership.role not in TenantRole.MANAGER_ROLES:
            return Response(
                {"error": {"code": "forbidden", "message": "Permission insuffisante."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        space = self._get_space(tenant_id, space_id)
        if not space:
            return Response(
                {"error": {"code": "not_found", "message": "Espace non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = KnowledgeSpaceCreateSerializer(space, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(KnowledgeSpaceSerializer(space).data)

    def delete(self, request, tenant_id, space_id):
        membership = TenantMembership.objects.filter(
            tenant_id=tenant_id, user=request.user, status="active"
        ).first()
        if not membership or membership.role not in TenantRole.ADMIN_ROLES:
            return Response(
                {"error": {"code": "forbidden", "message": "Accès réservé aux administrateurs."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        space = self._get_space(tenant_id, space_id)
        if not space:
            return Response(
                {"error": {"code": "not_found", "message": "Espace de connaissance non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if space.slug == "general":
            return Response(
                {"error": {"code": "forbidden", "message": "L'espace par défaut ne peut pas être supprimé."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        space.is_active = False
        space.save(update_fields=["is_active", "updated_at"])

        logger.info(
            "Knowledge space deleted",
            extra={"tenant_id": str(tenant_id), "space_id": str(space_id), "user_id": str(request.user.id)},
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


# ===========================
# Space Access Profiles
# ===========================

class SpaceProfileListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/space-profiles/  — List all profiles (admin only)
    POST /api/v1/tenants/{tenant_id}/space-profiles/  — Create a profile
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get(self, request, tenant_id):
        profiles = SpaceAccessProfile.objects.filter(
            tenant_id=tenant_id
        ).prefetch_related("spaces").order_by("name")
        return Response(SpaceAccessProfileSerializer(profiles, many=True).data)

    def post(self, request, tenant_id):
        serializer = SpaceAccessProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data["name"]
        if SpaceAccessProfile.objects.filter(tenant_id=tenant_id, name=name).exists():
            return Response(
                {"error": {"code": "duplicate_name", "message": "Un profil avec ce nom existe déjà."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = SpaceAccessProfile.objects.create(
            tenant_id=tenant_id,
            name=name,
            description=serializer.validated_data.get("description", ""),
            created_by=request.user,
        )

        space_ids = serializer.validated_data.get("space_ids", [])
        if space_ids:
            spaces = KnowledgeSpace.objects.filter(id__in=space_ids, tenant_id=tenant_id, is_active=True)
            profile.spaces.set(spaces)

        log_action(
            AuditAction.SPACE_PROFILE_CREATED,
            user=request.user, tenant_id=tenant_id,
            resource_type="space_profile", resource_id=profile.id,
            details={"name": name, "space_count": len(space_ids)},
            request=request,
        )

        return Response(SpaceAccessProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class SpaceProfileDetailView(APIView):
    """
    GET    /api/v1/tenants/{tenant_id}/space-profiles/{profile_id}/  — Profile details
    PATCH  /api/v1/tenants/{tenant_id}/space-profiles/{profile_id}/  — Update
    DELETE /api/v1/tenants/{tenant_id}/space-profiles/{profile_id}/  — Delete
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def _get_profile(self, tenant_id, profile_id):
        try:
            return SpaceAccessProfile.objects.prefetch_related("spaces").get(
                id=profile_id, tenant_id=tenant_id
            )
        except SpaceAccessProfile.DoesNotExist:
            return None

    def get(self, request, tenant_id, profile_id):
        profile = self._get_profile(tenant_id, profile_id)
        if not profile:
            return Response(
                {"error": {"code": "not_found", "message": "Profil non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SpaceAccessProfileSerializer(profile).data)

    def patch(self, request, tenant_id, profile_id):
        profile = self._get_profile(tenant_id, profile_id)
        if not profile:
            return Response(
                {"error": {"code": "not_found", "message": "Profil non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SpaceAccessProfileCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if "name" in serializer.validated_data:
            new_name = serializer.validated_data["name"]
            if SpaceAccessProfile.objects.filter(
                tenant_id=tenant_id, name=new_name
            ).exclude(id=profile_id).exists():
                return Response(
                    {"error": {"code": "duplicate_name", "message": "Un profil avec ce nom existe déjà."}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            profile.name = new_name

        if "description" in serializer.validated_data:
            profile.description = serializer.validated_data["description"]

        profile.save(update_fields=["name", "description", "updated_at"])

        if "space_ids" in serializer.validated_data:
            spaces = KnowledgeSpace.objects.filter(
                id__in=serializer.validated_data["space_ids"],
                tenant_id=tenant_id,
                is_active=True,
            )
            profile.spaces.set(spaces)

        return Response(SpaceAccessProfileSerializer(profile).data)

    def delete(self, request, tenant_id, profile_id):
        profile = self._get_profile(tenant_id, profile_id)
        if not profile:
            return Response(
                {"error": {"code": "not_found", "message": "Profil non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        log_action(
            AuditAction.SPACE_PROFILE_DELETED,
            user=request.user, tenant_id=tenant_id,
            resource_type="space_profile", resource_id=profile.id,
            details={"name": profile.name},
            request=request,
        )

        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ===========================
# User Space Access (direct grants)
# ===========================

class UserSpaceAccessView(APIView):
    """
    GET    /api/v1/tenants/{tenant_id}/members/{member_id}/space-access/
    POST   /api/v1/tenants/{tenant_id}/members/{member_id}/space-access/
    DELETE /api/v1/tenants/{tenant_id}/members/{member_id}/space-access/{space_id}/
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def _get_membership(self, tenant_id, member_id):
        try:
            return TenantMembership.objects.select_related("user").get(
                id=member_id, tenant_id=tenant_id
            )
        except TenantMembership.DoesNotExist:
            return None

    def get(self, request, tenant_id, member_id):
        membership = self._get_membership(tenant_id, member_id)
        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        accesses = UserSpaceAccess.objects.filter(
            tenant_id=tenant_id, user=membership.user
        ).select_related("space", "granted_by")
        return Response(UserSpaceAccessSerializer(accesses, many=True).data)

    def post(self, request, tenant_id, member_id):
        membership = self._get_membership(tenant_id, member_id)
        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        space_id = request.data.get("space_id")
        if not space_id:
            return Response(
                {"error": {"code": "missing_field", "message": "space_id est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            space = KnowledgeSpace.objects.get(id=space_id, tenant_id=tenant_id, is_active=True)
        except KnowledgeSpace.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Espace non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        access, created = UserSpaceAccess.objects.get_or_create(
            tenant_id=tenant_id,
            user=membership.user,
            space=space,
            defaults={"granted_by": request.user},
        )

        if not created:
            return Response(
                {"error": {"code": "already_granted", "message": "L'accès à cet espace est déjà accordé."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log_action(
            AuditAction.SPACE_ACCESS_GRANTED,
            user=request.user, tenant_id=tenant_id,
            resource_type="space_access", resource_id=access.id,
            details={"space_id": str(space_id), "user_id": str(membership.user.id)},
            request=request,
        )

        return Response(UserSpaceAccessSerializer(access).data, status=status.HTTP_201_CREATED)

    def delete(self, request, tenant_id, member_id, space_id):
        membership = self._get_membership(tenant_id, member_id)
        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            access = UserSpaceAccess.objects.get(
                tenant_id=tenant_id, user=membership.user, space_id=space_id
            )
        except UserSpaceAccess.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Accès non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        log_action(
            AuditAction.SPACE_ACCESS_REVOKED,
            user=request.user, tenant_id=tenant_id,
            resource_type="space_access", resource_id=access.id,
            details={"space_id": str(space_id), "user_id": str(membership.user.id)},
            request=request,
        )

        access.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ===========================
# User Space Profile Assignments
# ===========================

class UserSpaceProfileView(APIView):
    """
    GET    /api/v1/tenants/{tenant_id}/members/{member_id}/space-profiles/
    POST   /api/v1/tenants/{tenant_id}/members/{member_id}/space-profiles/
    DELETE /api/v1/tenants/{tenant_id}/members/{member_id}/space-profiles/{profile_id}/
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def _get_membership(self, tenant_id, member_id):
        try:
            return TenantMembership.objects.select_related("user").get(
                id=member_id, tenant_id=tenant_id
            )
        except TenantMembership.DoesNotExist:
            return None

    def get(self, request, tenant_id, member_id):
        membership = self._get_membership(tenant_id, member_id)
        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignments = UserSpaceProfile.objects.filter(
            tenant_id=tenant_id, user=membership.user
        ).select_related("profile", "granted_by").prefetch_related("profile__spaces")
        return Response(UserSpaceProfileSerializer(assignments, many=True).data)

    def post(self, request, tenant_id, member_id):
        membership = self._get_membership(tenant_id, member_id)
        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile_id = request.data.get("profile_id")
        if not profile_id:
            return Response(
                {"error": {"code": "missing_field", "message": "profile_id est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            profile = SpaceAccessProfile.objects.get(id=profile_id, tenant_id=tenant_id)
        except SpaceAccessProfile.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Profil non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        assignment, created = UserSpaceProfile.objects.get_or_create(
            tenant_id=tenant_id,
            user=membership.user,
            profile=profile,
            defaults={"granted_by": request.user},
        )

        if not created:
            return Response(
                {"error": {"code": "already_assigned", "message": "Ce profil est déjà assigné à cet utilisateur."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        log_action(
            AuditAction.SPACE_PROFILE_ASSIGNED,
            user=request.user, tenant_id=tenant_id,
            resource_type="space_profile_assignment", resource_id=assignment.id,
            details={"profile_id": str(profile_id), "user_id": str(membership.user.id)},
            request=request,
        )

        return Response(UserSpaceProfileSerializer(assignment).data, status=status.HTTP_201_CREATED)

    def delete(self, request, tenant_id, member_id, profile_id):
        membership = self._get_membership(tenant_id, member_id)
        if not membership:
            return Response(
                {"error": {"code": "not_found", "message": "Membre non trouvé."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            assignment = UserSpaceProfile.objects.get(
                tenant_id=tenant_id, user=membership.user, profile_id=profile_id
            )
        except UserSpaceProfile.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Assignation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        log_action(
            AuditAction.SPACE_PROFILE_REMOVED,
            user=request.user, tenant_id=tenant_id,
            resource_type="space_profile_assignment", resource_id=assignment.id,
            details={"profile_id": str(profile_id), "user_id": str(membership.user.id)},
            request=request,
        )

        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ===========================
# Tenant Summary (Dashboard Stats)
# ===========================

class TenantSummaryView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/summary/
    
    Returns real counts for Documents, Conversations, Membres, and Espaces.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        accessible = get_accessible_spaces(request.user, tenant_id)
        accessible_ids = accessible.values_list("id", flat=True)
        stats = {
            "documents": Document.objects.filter(tenant_id=tenant_id, knowledge_space_id__in=accessible_ids).count(),
            "conversations": Conversation.objects.filter(tenant_id=tenant_id, knowledge_space_id__in=accessible_ids).count(),
            "members": TenantMembership.objects.filter(tenant_id=tenant_id, status="active").count(),
            "spaces": accessible.count(),
        }
        return Response(stats)


# ===========================
# Invitations (tenant-scoped, admin only)
# ===========================

class InvitationListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/invitations/  — List invitations
    POST /api/v1/tenants/{tenant_id}/invitations/  — Create and send invitation
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get(self, request, tenant_id):
        invitations = UserInvitation.objects.filter(
            tenant_id=tenant_id
        ).select_related("invited_by").order_by("-created_at")
        return Response(UserInvitationSerializer(invitations, many=True).data)

    def post(self, request, tenant_id):
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].lower().strip()
        role = serializer.validated_data["role"]

        # Already a member?
        if TenantMembership.objects.filter(
            tenant_id=tenant_id, user__email=email, status="active"
        ).exists():
            return Response(
                {"error": {"code": "already_member", "message": "Cet utilisateur est déjà membre de l'organisation."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Already a pending invitation?
        if UserInvitation.objects.filter(
            tenant_id=tenant_id,
            email=email,
            consumed_at__isnull=True,
            revoked_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).exists():
            return Response(
                {"error": {"code": "already_invited", "message": "Une invitation est déjà en attente pour cet email."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation = UserInvitation.objects.create(
            tenant_id=tenant_id,
            email=email,
            role=role,
            invited_by=request.user,
        )

        try:
            send_invitation_email(invitation)
        except Exception:
            invitation.delete()
            return Response(
                {"error": {"code": "email_error", "message": "Impossible d'envoyer l'email d'invitation."}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        log_action(
            AuditAction.INVITATION_SENT,
            user=request.user, tenant_id=tenant_id,
            resource_type="invitation", resource_id=invitation.id,
            details={"email": email, "role": role},
            request=request,
        )

        return Response(UserInvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)


class InvitationDetailView(APIView):
    """
    DELETE /api/v1/tenants/{tenant_id}/invitations/{invitation_id}/  — Revoke invitation
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def delete(self, request, tenant_id, invitation_id):
        try:
            invitation = UserInvitation.objects.get(id=invitation_id, tenant_id=tenant_id)
        except UserInvitation.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Invitation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not invitation.is_pending:
            return Response(
                {"error": {"code": "not_pending", "message": "Cette invitation ne peut plus être révoquée."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invitation.revoked_at = timezone.now()
        invitation.save(update_fields=["revoked_at", "updated_at"])

        log_action(
            AuditAction.INVITATION_REVOKED,
            user=request.user, tenant_id=tenant_id,
            resource_type="invitation", resource_id=invitation.id,
            details={"email": invitation.email},
            request=request,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


# ===========================
# Invitations (public — no auth)
# ===========================

class InvitationPublicView(APIView):
    """
    GET /api/v1/invitations/{token}/  — Validate token and return invitation info.
    No authentication required.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            invitation = UserInvitation.objects.select_related("tenant").get(token=token)
        except UserInvitation.DoesNotExist:
            return Response(
                {"error": {"code": "invalid_token", "message": "Lien d'invitation invalide."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not invitation.is_pending:
            if invitation.consumed_at:
                msg = "Cette invitation a déjà été utilisée."
                code = "already_consumed"
            elif invitation.revoked_at:
                msg = "Cette invitation a été révoquée."
                code = "revoked"
            else:
                msg = "Cette invitation a expiré."
                code = "expired"
            return Response(
                {"error": {"code": code, "message": msg}},
                status=status.HTTP_410_GONE,
            )

        return Response({
            "email": invitation.email,
            "role": invitation.role,
            "tenant_name": invitation.tenant.name,
            "expires_at": invitation.expires_at,
        })


class InvitationAcceptView(APIView):
    """
    POST /api/v1/invitations/{token}/accept/  — Create account and join tenant.
    No authentication required.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        try:
            invitation = UserInvitation.objects.select_related("tenant").get(token=token)
        except UserInvitation.DoesNotExist:
            return Response(
                {"error": {"code": "invalid_token", "message": "Lien d'invitation invalide."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not invitation.is_pending:
            return Response(
                {"error": {"code": "invitation_unavailable", "message": "Cette invitation n'est plus valide."}},
                status=status.HTTP_410_GONE,
            )

        # Prevent re-registration if the email is already on the platform
        if User.objects.filter(email=invitation.email).exists():
            return Response(
                {
                    "error": {
                        "code": "email_exists",
                        "message": "Un compte existe déjà pour cet email. Connectez-vous puis demandez à un administrateur de vous ajouter.",
                    }
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = InvitationAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            email=invitation.email,
            full_name=serializer.validated_data["full_name"],
            password=serializer.validated_data["password"],
        )

        TenantMembership.objects.create(
            tenant=invitation.tenant,
            user=user,
            role=invitation.role,
            status="active",
        )

        invitation.consumed_at = timezone.now()
        invitation.save(update_fields=["consumed_at", "updated_at"])

        log_action(
            AuditAction.INVITATION_ACCEPTED,
            user=user, tenant_id=invitation.tenant_id,
            resource_type="invitation", resource_id=invitation.id,
            details={"email": invitation.email, "role": invitation.role},
            request=request,
        )

        refresh = RefreshToken.for_user(user)
        from apps.identity_access.api.serializers import UserProfileSerializer
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserProfileSerializer(user).data,
                "tenant_id": str(invitation.tenant_id),
            },
            status=status.HTTP_201_CREATED,
        )
