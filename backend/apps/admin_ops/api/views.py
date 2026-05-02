"""
DocPilot AI — Admin Ops: User Management Views
"""

import logging

from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction
from apps.core.pagination import StandardPagination
from apps.core.permissions import IsSuperOwner
from apps.identity_access.models import User

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
                "membership_count": u.tenantmembership_set.count(),
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
