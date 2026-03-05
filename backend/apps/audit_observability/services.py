"""
DocPilot AI — Audit Service

Centralized `log_action()` function used across all modules.
"""

import logging
import threading

from apps.audit_observability.models import AuditLog

logger = logging.getLogger("apps.audit_observability")

# Thread-local storage for request context
_request_local = threading.local()


def set_request_context(request):
    """Store request context for audit logging (called from middleware)."""
    _request_local.request = request


def get_request_context():
    """Get stored request context."""
    return getattr(_request_local, "request", None)


def log_action(
    action: str,
    user=None,
    tenant=None,
    tenant_id=None,
    resource_type: str = "",
    resource_id: str = "",
    details: dict | None = None,
    request=None,
):
    """
    Create an audit log entry.

    Usage:
        from apps.audit_observability.services import log_action

        log_action(
            action=AuditAction.DOCUMENT_UPLOADED,
            user=request.user,
            tenant_id=tenant_id,
            resource_type="document",
            resource_id=str(document.id),
            details={"file_name": file.name, "size": file.size},
            request=request,
        )
    """
    if request is None:
        request = get_request_context()

    ip_address = None
    user_agent = ""
    request_id = ""

    if request:
        ip_address = _get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]
        request_id = getattr(request, "request_id", "")

    try:
        entry = AuditLog.objects.create(
            action=action,
            user=user,
            tenant=tenant,
            tenant_id=tenant_id if tenant is None else None,
            resource_type=resource_type,
            resource_id=str(resource_id),
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
        )

        logger.info(
            "Audit log created",
            extra={
                "audit_action": action,
                "user_id": str(user.id) if user else None,
                "tenant_id": str(tenant_id or (tenant.id if tenant else None)),
                "resource_type": resource_type,
                "resource_id": str(resource_id),
                "request_id": request_id,
            },
        )

        return entry

    except Exception as e:
        logger.error(f"Failed to create audit log: {e}", exc_info=True)
        return None


def _get_client_ip(request) -> str | None:
    """Extract client IP from request headers."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
