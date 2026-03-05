"""
DocPilot AI — Audit & Observability Models

AuditLog for tracking all user actions across the platform.
"""

from django.conf import settings
from django.db import models

from apps.core.models import BaseUUIDModel


class AuditLog(BaseUUIDModel):
    """
    Immutable audit log entry.

    Tracks all significant user actions for compliance,
    debugging, and admin visibility.
    """

    tenant = models.ForeignKey(
        "tenancy.Tenant",
        on_delete=models.CASCADE,
        related_name="audit_logs",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=50, db_index=True)
    resource_type = models.CharField(max_length=50, blank=True, default="")
    resource_id = models.CharField(max_length=100, blank=True, default="")
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    request_id = models.CharField(max_length=64, blank=True, default="")

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        indexes = [
            models.Index(fields=["tenant", "action"]),
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["user", "action"]),
        ]

    def __str__(self):
        return f"[{self.action}] {self.user} — {self.created_at:%Y-%m-%d %H:%M}"
