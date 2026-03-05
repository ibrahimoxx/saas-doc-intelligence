"""
DocPilot AI — Conversations Models

Conversation, Message, MessageCitation.
"""

from django.conf import settings
from django.db import models

from apps.core.constants import ConversationStatus, MessageRole
from apps.core.models import BaseUUIDModel


class Conversation(BaseUUIDModel):
    """
    A conversation thread within a tenant/knowledge space.
    """

    tenant = models.ForeignKey(
        "tenancy.Tenant",
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    knowledge_space = models.ForeignKey(
        "tenancy.KnowledgeSpace",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="conversations",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    title = models.CharField(max_length=300, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=ConversationStatus.CHOICES,
        default=ConversationStatus.ACTIVE,
        db_index=True,
    )

    class Meta:
        db_table = "conversations"
        ordering = ["-updated_at"]
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"

    def __str__(self):
        return self.title or f"Conversation {str(self.id)[:8]}"

    @property
    def message_count(self):
        return self.messages.count()


class Message(BaseUUIDModel):
    """
    A single message in a conversation (user or assistant).
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(
        max_length=20,
        choices=MessageRole.CHOICES,
        default=MessageRole.USER,
    )
    content = models.TextField()
    model_name = models.CharField(max_length=50, blank=True, default="")
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    total_tokens = models.PositiveIntegerField(default=0)
    latency_ms = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        verbose_name = "Message"
        verbose_name_plural = "Messages"

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}..."


class MessageCitation(BaseUUIDModel):
    """
    A citation linking a message to a document chunk source.
    """

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="citations",
    )
    chunk = models.ForeignKey(
        "ingestion.DocumentChunk",
        on_delete=models.SET_NULL,
        null=True,
        related_name="citations",
    )
    document_title = models.CharField(max_length=500, blank=True, default="")
    file_name = models.CharField(max_length=500, blank=True, default="")
    page_number = models.PositiveIntegerField(null=True, blank=True)
    similarity = models.FloatField(default=0.0)
    excerpt = models.TextField(blank=True, default="")

    class Meta:
        db_table = "message_citations"
        ordering = ["-similarity"]
        verbose_name = "Citation"
        verbose_name_plural = "Citations"

    def __str__(self):
        return f"Citation: {self.document_title} p.{self.page_number}"
