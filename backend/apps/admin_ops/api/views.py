"""
DocPilot AI — Admin Ops: User Management Views
"""

import logging

from django.db import transaction
from django.db.models import Count, Q
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction, TenantRole, TenantStatus
from apps.core.pagination import StandardPagination
from apps.core.permissions import IsSuperOwner
from apps.identity_access.models import User
from apps.tenancy.models import KnowledgeSpace, Tenant, TenantMembership, UserInvitation
from apps.tenancy.services import send_invitation_email

logger = logging.getLogger("apps.admin_ops")


class AdminUsersListView(APIView):
    """
    GET  /api/v1/admin/users/  — List all platform users (super owner only)
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOwner]

    def get(self, request):
        users = User.objects.all().order_by("-created_at")

        is_active = request.query_params.get("is_active")
        if is_active is not None:
            users = users.filter(is_active=is_active.lower() == "true")

        is_superuser = request.query_params.get("is_superuser")
        if is_superuser is not None:
            users = users.filter(is_superuser=is_superuser.lower() == "true")

        search = request.query_params.get("search", "").strip()
        if search:
            users = users.filter(Q(email__icontains=search) | Q(full_name__icontains=search))

        paginator = StandardPagination()
        page = paginator.paginate_queryset(users, request)
        data = [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "is_superuser": u.is_superuser,
                "created_at": u.created_at,
                "membership_count": u.memberships.count(),
            }
            for u in page
        ]
        return paginator.get_paginated_response(data)


class AdminUserDetailView(APIView):
    """
    PATCH  /api/v1/admin/users/<user_id>/  — Toggle is_active, is_superuser, full_name
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOwner]

    def patch(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Utilisateur introuvable."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Cannot deactivate yourself
        if target_user == request.user and request.data.get("is_active") is False:
            return Response(
                {"error": {"code": "forbidden", "message": "Vous ne pouvez pas désactiver votre propre compte."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        allowed_fields = ["is_active", "is_superuser", "full_name"]
        updated = []

        for field in allowed_fields:
            if field in request.data:
                old_val = getattr(target_user, field)
                new_val = request.data[field]
                setattr(target_user, field, new_val)
                updated.append(field)

                if field == "is_active":
                    action = AuditAction.USER_ACTIVATED if new_val else AuditAction.USER_DEACTIVATED
                    log_action(
                        action=action,
                        user=request.user,
                        resource_type="user",
                        resource_id=str(target_user.id),
                        details={"target_user": target_user.email, "previous": old_val, "new": new_val},
                        request=request,
                    )

        if not updated:
            return Response(
                {"error": {"code": "bad_request", "message": "Aucun champ valide fourni."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.save(update_fields=updated + ["updated_at"])

        logger.info(
            "Admin user updated",
            extra={
                "target_user_id": str(target_user.id),
                "updated_fields": updated,
                "by_user_id": str(request.user.id),
            },
        )

        return Response(
            {
                "id": str(target_user.id),
                "email": target_user.email,
                "full_name": target_user.full_name,
                "is_active": target_user.is_active,
                "is_superuser": target_user.is_superuser,
                "created_at": target_user.created_at,
            }
        )


class AdminTenantsListView(APIView):
    """
    GET  /api/v1/admin/tenants/  - List all tenants (super owner only)
    POST /api/v1/admin/tenants/  - Create a tenant (super owner only)
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOwner]

    def _serialize_tenant(self, tenant):
        from apps.documents.models import Document

        return {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "member_count": getattr(tenant, "member_count", tenant.memberships.count()),
            "space_count": KnowledgeSpace.objects.filter(tenant=tenant).count(),
            "document_count": Document.objects.filter(tenant=tenant).count(),
        }

    def get(self, request):
        tenants = Tenant.objects.annotate(
            member_count=Count("memberships", distinct=True)
        ).order_by("-created_at")

        search = request.query_params.get("search", "").strip()
        if search:
            tenants = tenants.filter(Q(name__icontains=search) | Q(slug__icontains=search))

        tenant_status = request.query_params.get("status", "").strip()
        if tenant_status:
            tenants = tenants.filter(status=tenant_status)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(tenants, request)
        data = [self._serialize_tenant(tenant) for tenant in page]
        return paginator.get_paginated_response(data)

    @transaction.atomic
    def post(self, request):
        name = (request.data.get("name") or "").strip()
        raw_slug = (request.data.get("slug") or "").strip()
        owner_email = (request.data.get("owner_email") or "").strip().lower()
        slug = slugify(raw_slug)

        if not name:
            return Response(
                {"error": {"code": "missing_name", "message": "Le nom est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not raw_slug or not slug:
            return Response(
                {"error": {"code": "missing_slug", "message": "Le slug est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not owner_email:
            return Response(
                {"error": {"code": "missing_owner_email", "message": "L'email du propri\xE9taire est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Tenant.objects.filter(slug=slug).exists():
            return Response(
                {"error": {"code": "duplicate_slug", "message": "Ce slug est d\xE9j\xE0 utilis\xE9."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tenant = Tenant.objects.create(
            name=name,
            slug=slug,
            status=TenantStatus.ACTIVE,
        )

        KnowledgeSpace.objects.create(
            tenant=tenant,
            name="G\xE9n\xE9ral",
            slug="general",
            description="Espace de connaissance par d\xE9faut",
            created_by=request.user,
        )

        existing_user = User.objects.filter(email=owner_email).first()
        if existing_user:
            TenantMembership.objects.create(
                tenant=tenant,
                user=existing_user,
                role=TenantRole.OWNER,
                status="active",
            )
            owner_assigned = True
        else:
            invitation = UserInvitation.objects.create(
                tenant=tenant,
                email=owner_email,
                role=TenantRole.OWNER,
                invited_by=request.user,
            )
            try:
                send_invitation_email(invitation)
            except Exception:
                logger.exception(
                    "Failed to send tenant owner invitation email",
                    extra={"tenant_id": str(tenant.id), "owner_email": owner_email},
                )
            owner_assigned = False

        log_action(
            AuditAction.TENANT_CREATED_BY_SUPER,
            user=request.user,
            resource_type="tenant",
            resource_id=str(tenant.id),
            details={
                "name": name,
                "slug": slug,
                "owner_email": owner_email,
                "owner_assigned": owner_assigned,
            },
            request=request,
            tenant_id=tenant.id,
        )

        payload = self._serialize_tenant(tenant)
        payload["owner_assigned"] = owner_assigned
        payload["message"] = "Organisation cr\xE9\xE9e avec succ\xE8s."
        return Response(payload, status=status.HTTP_201_CREATED)


class AdminTenantDetailView(APIView):
    """
    GET   /api/v1/admin/tenants/<tenant_id>/               - Tenant detail
    PATCH /api/v1/admin/tenants/<tenant_id>/               - Update tenant status
    POST  /api/v1/admin/tenants/<tenant_id>/memberships/   - Assign user to tenant
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOwner]

    def _get_tenant(self, tenant_id):
        try:
            return Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return None

    def _serialize_tenant(self, tenant):
        from apps.documents.models import Document

        return {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "member_count": TenantMembership.objects.filter(tenant=tenant).count(),
            "space_count": KnowledgeSpace.objects.filter(tenant=tenant).count(),
            "document_count": Document.objects.filter(tenant=tenant).count(),
        }

    def get(self, request, tenant_id):
        tenant = self._get_tenant(tenant_id)
        if not tenant:
            return Response(
                {"error": {"code": "not_found", "message": "Organisation introuvable."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = self._serialize_tenant(tenant)
        memberships = TenantMembership.objects.filter(tenant_id=tenant_id).select_related("user")
        data["members"] = [
            {
                "id": str(membership.id),
                "user_id": str(membership.user.id),
                "user_email": membership.user.email,
                "user_full_name": membership.user.full_name,
                "role": membership.role,
                "status": membership.status,
            }
            for membership in memberships
        ]
        return Response(data)

    def patch(self, request, tenant_id):
        tenant = self._get_tenant(tenant_id)
        if not tenant:
            return Response(
                {"error": {"code": "not_found", "message": "Organisation introuvable."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if set(request.data.keys()) != {"status"}:
            return Response(
                {
                    "error": {
                        "code": "invalid_payload",
                        "message": "Seul le champ status peut \xEAtre modifi\xE9.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")
        allowed_statuses = {TenantStatus.ACTIVE, TenantStatus.SUSPENDED}
        if new_status not in allowed_statuses:
            return Response(
                {
                    "error": {
                        "code": "invalid_status",
                        "message": "Le statut doit \xEAtre 'active' ou 'suspended'.",
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        owner_count = TenantMembership.objects.filter(
            tenant=tenant,
            role=TenantRole.OWNER,
        ).count()
        if new_status == TenantStatus.SUSPENDED and owner_count == 1:
            logger.info(
                "Suspending tenant with a single owner membership",
                extra={"tenant_id": str(tenant.id), "by_user_id": str(request.user.id)},
            )

        previous_status = tenant.status
        tenant.status = new_status
        tenant.save(update_fields=["status", "updated_at"])

        action = (
            AuditAction.TENANT_SUSPENDED
            if new_status == TenantStatus.SUSPENDED
            else AuditAction.ADMIN_ACTION
        )
        log_action(
            action,
            user=request.user,
            resource_type="tenant",
            resource_id=str(tenant.id),
            details={
                "name": tenant.name,
                "slug": tenant.slug,
                "previous_status": previous_status,
                "new_status": new_status,
            },
            request=request,
            tenant_id=tenant.id,
        )

        return Response(self._serialize_tenant(tenant))

    def post(self, request, tenant_id):
        tenant = self._get_tenant(tenant_id)
        if not tenant:
            return Response(
                {"error": {"code": "not_found", "message": "Organisation introuvable."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        user_email = (request.data.get("user_email") or "").strip().lower()
        role = request.data.get("role")

        if not user_email:
            return Response(
                {"error": {"code": "missing_user_email", "message": "L'email utilisateur est requis."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role not in TenantRole.ALL_ROLES:
            return Response(
                {"error": {"code": "invalid_role", "message": "Le r\xF4le fourni est invalide."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Utilisateur introuvable."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        membership = TenantMembership.objects.filter(tenant=tenant, user=user).first()
        if membership:
            membership.role = role
            membership.save(update_fields=["role", "updated_at"])
        else:
            membership = TenantMembership.objects.create(
                tenant=tenant,
                user=user,
                role=role,
                status="active",
            )

        log_action(
            AuditAction.ROLE_GRANTED,
            user=request.user,
            resource_type="membership",
            resource_id=str(membership.id),
            details={
                "tenant_id": str(tenant.id),
                "user_email": user.email,
                "role": role,
            },
            request=request,
            tenant_id=tenant.id,
        )

        return Response(
            {
                "id": str(membership.id),
                "user_email": user.email,
                "role": membership.role,
                "status": membership.status,
            },
            status=status.HTTP_201_CREATED,
        )
