"""
DocPilot AI — Tenancy Models

Tenant, TenantMembership, KnowledgeSpace.
"""

from django.conf import settings
from django.db import models

from apps.core.constants import MembershipStatus, TenantRole, TenantStatus
from apps.core.models import BaseUUIDModel, SoftDeleteManager, SoftDeleteModel


class Tenant(BaseUUIDModel):
    """Organization / tenant."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    status = models.CharField(
        max_length=20,
        choices=TenantStatus.CHOICES,
        default=TenantStatus.ACTIVE,
        db_index=True,
    )

    class Meta:
        db_table = "tenants"
        verbose_name = "Organisation"
        verbose_name_plural = "Organisations"

    def __str__(self):
        return self.name


class TenantMembership(BaseUUIDModel):
    """User ↔ Tenant relationship with role."""

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=TenantRole.CHOICES,
        default=TenantRole.MEMBER,
    )
    status = models.CharField(
        max_length=20,
        choices=MembershipStatus.CHOICES,
        default=MembershipStatus.ACTIVE,
    )

    class Meta:
        db_table = "tenant_memberships"
        unique_together = [("tenant", "user")]
        verbose_name = "Membre"
        verbose_name_plural = "Membres"

    def __str__(self):
        return f"{self.user.email} → {self.tenant.name} ({self.role})"


class KnowledgeSpace(BaseUUIDModel, SoftDeleteModel):
    """
    Knowledge space / document collection within a tenant.
    A default space is auto-created with each tenant.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="knowledge_spaces",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_knowledge_spaces",
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "knowledge_spaces"
        unique_together = [("tenant", "slug")]
        verbose_name = "Espace de connaissance"
        verbose_name_plural = "Espaces de connaissance"

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"
