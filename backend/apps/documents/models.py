"""
DocPilot AI — Documents Models

Document, DocumentVersion, DocumentProcessingJob.
"""

from django.conf import settings
from django.db import models

from apps.core.constants import DocumentStatus, JobStatus, JobType
from apps.core.models import BaseUUIDModel, SoftDeleteManager, SoftDeleteModel


class Document(BaseUUIDModel, SoftDeleteModel):
    """
    Logical document entity within a tenant/knowledge space.
    Each document can have multiple versions.
    """

    tenant = models.ForeignKey(
        "tenancy.Tenant",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    knowledge_space = models.ForeignKey(
        "tenancy.KnowledgeSpace",
        on_delete=models.CASCADE,
        related_name="documents",
    )
    title = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.CHOICES,
        default=DocumentStatus.QUEUED,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents",
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "documents"
        ordering = ["-created_at"]
        verbose_name = "Document"
        verbose_name_plural = "Documents"

    def __str__(self):
        return f"{self.title} ({self.status})"

    @property
    def current_version(self):
        """Return the latest version."""
        return self.versions.order_by("-version_number").first()


class DocumentVersion(BaseUUIDModel):
    """
    A specific version of a document file.
    Stores file metadata and indexing status.
    """

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField(default=1)
    file_name = models.CharField(max_length=500)
    file_path = models.CharField(max_length=1000)
    mime_type = models.CharField(max_length=100, default="application/pdf")
    file_size_bytes = models.BigIntegerField(default=0)
    file_hash = models.CharField(max_length=64, blank=True, default="")
    page_count = models.PositiveIntegerField(null=True, blank=True)
    indexing_status = models.CharField(
        max_length=20,
        choices=DocumentStatus.CHOICES,
        default=DocumentStatus.QUEUED,
        db_index=True,
    )

    class Meta:
        db_table = "document_versions"
        unique_together = [("document", "version_number")]
        ordering = ["-version_number"]
        verbose_name = "Version de document"
        verbose_name_plural = "Versions de document"

    def __str__(self):
        return f"{self.document.title} v{self.version_number}"


class DocumentProcessingJob(BaseUUIDModel):
    """
    Processing job for a document version (parse, chunk, embed).
    """

    document_version = models.ForeignKey(
        DocumentVersion,
        on_delete=models.CASCADE,
        related_name="processing_jobs",
    )
    job_type = models.CharField(
        max_length=20,
        choices=JobType.CHOICES,
        default=JobType.INDEX,
    )
    status = models.CharField(
        max_length=20,
        choices=JobStatus.CHOICES,
        default=JobStatus.QUEUED,
        db_index=True,
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "document_processing_jobs"
        ordering = ["-created_at"]
        verbose_name = "Job de traitement"
        verbose_name_plural = "Jobs de traitement"

    def __str__(self):
        return f"Job {self.job_type} — {self.status} ({self.document_version})"
