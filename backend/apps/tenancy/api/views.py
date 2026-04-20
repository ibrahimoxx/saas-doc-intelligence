"""
DocPilot AI — Tenancy API Views
"""

import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.constants import TenantRole
from apps.core.permissions import IsTenantAdmin, IsTenantMember
from apps.identity_access.models import User
from apps.tenancy.api.serializers import (
    InviteMemberSerializer,
    KnowledgeSpaceCreateSerializer,
    KnowledgeSpaceSerializer,
    TenantCreateSerializer,
    TenantMemberSerializer,
    TenantMembershipSerializer,
    TenantPermissionsSerializer,
    TenantSerializer,
    UpdateMemberRoleSerializer,
)
from apps.tenancy.models import KnowledgeSpace, Tenant, TenantMembership
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
        permissions_data = {
            "role": role,
            "can_upload": role in TenantRole.MANAGER_ROLES,
            "can_delete_documents": role in TenantRole.MANAGER_ROLES,
            "can_manage_members": role in TenantRole.ADMIN_ROLES,
            "can_view_admin": role in TenantRole.MANAGER_ROLES,
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

        # Cannot change owner role
        if target_membership.role == TenantRole.OWNER:
            return Response(
                {"error": {"code": "forbidden", "message": "Le rôle du propriétaire ne peut pas être modifié."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_membership.role = serializer.validated_data["role"]
        target_membership.save(update_fields=["role", "updated_at"])

        logger.info(
            "Member role changed",
            extra={
                "tenant_id": tenant_id,
                "member_id": member_id,
                "new_role": target_membership.role,
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
        spaces = KnowledgeSpace.objects.filter(
            tenant_id=tenant_id,
            is_active=True,
        ).order_by("name")

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
    DELETE /api/v1/tenants/{tenant_id}/spaces/{space_id}/  — Soft-delete a knowledge space (admin+)
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def delete(self, request, tenant_id, space_id):
        try:
            space = KnowledgeSpace.objects.get(id=space_id, tenant_id=tenant_id, is_active=True)
        except KnowledgeSpace.DoesNotExist:
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
# Tenant Summary (Dashboard Stats)
# ===========================

class TenantSummaryView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/summary/
    
    Returns real counts for Documents, Conversations, Membres, and Espaces.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        stats = {
            "documents": Document.objects.filter(tenant_id=tenant_id).count(),
            "conversations": Conversation.objects.filter(tenant_id=tenant_id).count(),
            "members": TenantMembership.objects.filter(tenant_id=tenant_id, status="active").count(),
            "spaces": KnowledgeSpace.objects.filter(tenant_id=tenant_id, is_active=True).count(),
        }
        return Response(stats)
