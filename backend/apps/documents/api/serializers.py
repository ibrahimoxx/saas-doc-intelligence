"""
DocPilot AI — Documents Serializers
"""

from rest_framework import serializers

from apps.documents.models import Document, DocumentProcessingJob, DocumentVersion


class DocumentVersionSerializer(serializers.ModelSerializer):
    """DocumentVersion details."""

    class Meta:
        model = DocumentVersion
        fields = [
            "id", "version_number", "file_name", "mime_type",
            "file_size_bytes", "page_count", "indexing_status", "created_at",
        ]
        read_only_fields = fields


class DocumentSerializer(serializers.ModelSerializer):
    """Document with current version info."""

    current_version = DocumentVersionSerializer(read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True, default=None)

    class Meta:
        model = Document
        fields = [
            "id", "title", "status", "knowledge_space_id",
            "created_by_email", "current_version", "created_at", "updated_at",
        ]
        read_only_fields = fields


class DocumentUploadSerializer(serializers.Serializer):
    """Validate document upload."""

    file = serializers.FileField()
    title = serializers.CharField(max_length=500, required=False)
    knowledge_space_id = serializers.UUIDField()

    def validate_file(self, value):
        from django.conf import settings

        # Check file size
        if value.size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise serializers.ValidationError(
                f"Le fichier dépasse la taille maximale ({settings.MAX_UPLOAD_SIZE_MB} Mo)."
            )

        # Check file type
        if value.content_type not in settings.ALLOWED_UPLOAD_TYPES:
            raise serializers.ValidationError(
                f"Type de fichier non supporté. Types acceptés : {', '.join(settings.ALLOWED_UPLOAD_TYPES)}"
            )

        # Check extension
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            raise serializers.ValidationError(
                f"Extension non supportée. Extensions acceptées : {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}"
            )

        return value


class DocumentProcessingJobSerializer(serializers.ModelSerializer):
    """Processing job details."""

    class Meta:
        model = DocumentProcessingJob
        fields = ["id", "job_type", "status", "started_at", "completed_at", "error_message", "created_at"]
        read_only_fields = fields
