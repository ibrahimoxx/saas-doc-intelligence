"""
DocPilot AI — Retrieval Models

QueryLog and ModelUsageLog for tracking RAG usage.
"""

from django.conf import settings
from django.db import models

from apps.core.constants import ModelUsageType, QueryStatus
from apps.core.models import BaseUUIDModel


class QueryLog(BaseUUIDModel):
    """
    Log of every RAG question asked.
    """

    tenant = models.ForeignKey(
        "tenancy.Tenant",
        on_delete=models.CASCADE,
        related_name="query_logs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="query_logs",
    )
    knowledge_space = models.ForeignKey(
        "tenancy.KnowledgeSpace",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="query_logs",
    )
    question = models.TextField()
    answer = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=QueryStatus.CHOICES,
        default=QueryStatus.OK,
    )
    chunks_used = models.PositiveIntegerField(default=0)
    model_name = models.CharField(max_length=50, blank=True, default="")
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    total_tokens = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "query_logs"
        ordering = ["-created_at"]
        verbose_name = "Log de requête"
        verbose_name_plural = "Logs de requête"

    def __str__(self):
        return f"[{self.status}] {self.question[:50]}..."
