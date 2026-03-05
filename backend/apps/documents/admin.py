from django.contrib import admin

from apps.documents.models import Document, DocumentProcessingJob, DocumentVersion


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "tenant", "knowledge_space", "status", "created_by", "created_at")
    list_filter = ("status", "tenant")
    search_fields = ("title",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ("document", "version_number", "file_name", "file_size_bytes", "indexing_status", "created_at")
    list_filter = ("indexing_status",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(DocumentProcessingJob)
class DocumentProcessingJobAdmin(admin.ModelAdmin):
    list_display = ("document_version", "job_type", "status", "started_at", "completed_at")
    list_filter = ("status", "job_type")
    readonly_fields = ("id", "created_at", "updated_at")
