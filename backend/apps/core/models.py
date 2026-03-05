"""
DocPilot AI — Core Base Models

Reusable abstract models providing common fields for all business entities.
"""

import uuid

from django.db import models


class BaseTimestampedModel(models.Model):
    """Abstract model with created_at and updated_at timestamps."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class BaseUUIDModel(BaseTimestampedModel):
    """Abstract model with UUID primary key and timestamps."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class TenantScopedModel(BaseUUIDModel):
    """
    Abstract model for tenant-scoped entities.

    All business data models should inherit from this to ensure
    tenant isolation by design.

    The tenant FK is defined as a string to avoid circular imports.
    Concrete models should override this if needed.
    """

    tenant = models.ForeignKey(
        "tenancy.Tenant",
        on_delete=models.CASCADE,
        related_name="%(class)s_set",
        db_index=True,
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteModel(models.Model):
    """
    Mixin for soft delete support.

    Use with TenantScopedModel or BaseUUIDModel:
        class MyModel(TenantScopedModel, SoftDeleteModel):
            ...
    """

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        abstract = True

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self):
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at", "updated_at"])


class SoftDeleteManager(models.Manager):
    """Manager that excludes soft-deleted records by default."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager):
    """Manager that includes soft-deleted records."""

    pass
