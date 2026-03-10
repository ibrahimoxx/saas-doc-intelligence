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
        import filetype
        import os

        # 1. Check file size first (already enforced by Django partially, but strictly enforced here)
        if value.size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise serializers.ValidationError(
                f"Le fichier dépasse la taille maximale ({settings.MAX_UPLOAD_SIZE_MB} Mo)."
            )

        # 2. Check extension
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            raise serializers.ValidationError(
                f"Extension non supportée. Extensions acceptées : {', '.join(settings.ALLOWED_UPLOAD_EXTENSIONS)}"
            )

        # 3. Read first 2048 bytes for Magic Number MIME type guess
        header = value.read(2048)
        value.seek(0)  # Reset file pointer for later reading

        kind = filetype.guess(header)
        
        # Security: If filetype can't guess it, or it doesn't match allowed types
        if kind is None or kind.mime not in settings.ALLOWED_UPLOAD_TYPES:
            raise serializers.ValidationError(
                f"Le contenu réel du fichier n'est pas supporté ou est potentiellement corrompu."
            )

        return value


class DocumentProcessingJobSerializer(serializers.ModelSerializer):
    """Processing job details."""

    class Meta:
        model = DocumentProcessingJob
        fields = ["id", "job_type", "status", "started_at", "completed_at", "error_message", "created_at"]
        read_only_fields = fields
