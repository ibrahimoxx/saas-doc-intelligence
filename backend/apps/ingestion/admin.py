from django.contrib import admin

from apps.ingestion.models import DocumentChunk


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ("document_version", "chunk_index", "page_number", "token_count", "tenant", "created_at")
    list_filter = ("tenant", "knowledge_space")
    search_fields = ("content",)
    readonly_fields = ("id", "created_at", "updated_at", "embedding")

    def has_add_permission(self, request):
        return False  # Chunks are created by the ingestion pipeline
