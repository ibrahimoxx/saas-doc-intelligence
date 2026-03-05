"""
DocPilot AI — Ingestion Models

DocumentChunk: stores parsed text chunks with vector embeddings.
"""

from django.db import models
from pgvector.django import VectorField

from apps.core.models import BaseUUIDModel


class DocumentChunk(BaseUUIDModel):
    """
    A chunk of text extracted from a document version,
    with its vector embedding for similarity search.
    """

    document_version = models.ForeignKey(
        "documents.DocumentVersion",
        on_delete=models.CASCADE,
        related_name="chunks",
    )
    tenant = models.ForeignKey(
        "tenancy.Tenant",
        on_delete=models.CASCADE,
        related_name="document_chunks",
    )
    knowledge_space = models.ForeignKey(
        "tenancy.KnowledgeSpace",
        on_delete=models.CASCADE,
        related_name="document_chunks",
    )
    chunk_index = models.PositiveIntegerField()
    content = models.TextField()
    page_number = models.PositiveIntegerField(null=True, blank=True)
    token_count = models.PositiveIntegerField(default=0)
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "document_chunks"
        ordering = ["chunk_index"]
        unique_together = [("document_version", "chunk_index")]
        verbose_name = "Chunk de document"
        verbose_name_plural = "Chunks de document"
        indexes = [
            models.Index(fields=["tenant", "knowledge_space"]),
        ]

    def __str__(self):
        return f"Chunk {self.chunk_index} — {self.document_version}"
