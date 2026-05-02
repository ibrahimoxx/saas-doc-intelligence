"""
DocPilot AI — Tenancy Models

Tenant, TenantMembership, KnowledgeSpace, SpaceAccessProfile, UserSpaceAccess, UserSpaceProfile,
UserInvitation.
"""

import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

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


class SpaceAccessProfile(BaseUUIDModel):
    """
    Reusable permission profile that bundles access to N knowledge spaces.
    Admins create profiles, then assign them to multiple users.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="space_profiles",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    spaces = models.ManyToManyField(
        KnowledgeSpace,
        related_name="profiles",
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_space_profiles",
    )

    class Meta:
        db_table = "space_access_profiles"
        unique_together = [("tenant", "name")]
        verbose_name = "Profil d'accès aux espaces"
        verbose_name_plural = "Profils d'accès aux espaces"

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class UserSpaceAccess(BaseUUIDModel):
    """
    Direct user → space grant.
    Gives a specific user access to a specific knowledge space.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="space_accesses",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="space_accesses",
    )
    space = models.ForeignKey(
        KnowledgeSpace,
        on_delete=models.CASCADE,
        related_name="direct_accesses",
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_space_accesses",
    )

    class Meta:
        db_table = "user_space_accesses"
        unique_together = [("tenant", "user", "space")]
        verbose_name = "Accès direct à un espace"
        verbose_name_plural = "Accès directs aux espaces"

    def __str__(self):
        return f"{self.user.email} → {self.space.name}"


class UserSpaceProfile(BaseUUIDModel):
    """
    User → SpaceAccessProfile assignment.
    Assigns a reusable profile to a user, granting them all spaces in that profile.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="user_space_profiles",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="space_profile_assignments",
    )
    profile = models.ForeignKey(
        SpaceAccessProfile,
        on_delete=models.CASCADE,
        related_name="user_assignments",
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_space_profiles",
    )

    class Meta:
        db_table = "user_space_profiles"
        unique_together = [("tenant", "user", "profile")]
        verbose_name = "Profil assigné à un utilisateur"
        verbose_name_plural = "Profils assignés aux utilisateurs"

    def __str__(self):
        return f"{self.user.email} → {self.profile.name}"


def _default_token():
    return secrets.token_urlsafe(32)


def _default_expires_at():
    return timezone.now() + timedelta(days=7)


class UserInvitation(BaseUUIDModel):
    """
    Token-based invitation that lets a brand-new person join a tenant.
    Consumed once accepted; can be revoked by an admin before that.
    """

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=TenantRole.CHOICES,
        default=TenantRole.MEMBER,
    )
    token = models.CharField(max_length=64, unique=True, default=_default_token)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )
    expires_at = models.DateTimeField(default=_default_expires_at)
    consumed_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_invitations"
        verbose_name = "Invitation"
        verbose_name_plural = "Invitations"

    def __str__(self):
        return f"Invitation {self.email} → {self.tenant.name} ({self.role})"

    @property
    def is_pending(self):
        return (
            self.consumed_at is None
            and self.revoked_at is None
            and self.expires_at > timezone.now()
        )
