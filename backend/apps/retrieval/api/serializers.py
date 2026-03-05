"""
DocPilot AI — Retrieval API Serializers
"""

from rest_framework import serializers

from django.conf import settings


class AskQuestionSerializer(serializers.Serializer):
    """Validate a RAG question."""

    question = serializers.CharField(
        max_length=settings.RAG_MAX_QUESTION_LENGTH,
        min_length=3,
    )
    knowledge_space_id = serializers.UUIDField(required=False, allow_null=True)


class CitationSerializer(serializers.Serializer):
    """Citation in a RAG response."""

    chunk_id = serializers.CharField()
    document_title = serializers.CharField()
    file_name = serializers.CharField()
    page_number = serializers.IntegerField(allow_null=True)
    similarity = serializers.FloatField()
    excerpt = serializers.CharField()


class AskResponseSerializer(serializers.Serializer):
    """RAG response with citations."""

    answer = serializers.CharField()
    citations = CitationSerializer(many=True)
    model = serializers.CharField()
    tokens_used = serializers.DictField()
    status = serializers.CharField()
