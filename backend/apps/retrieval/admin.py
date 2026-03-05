from django.contrib import admin

from apps.retrieval.models import QueryLog


@admin.register(QueryLog)
class QueryLogAdmin(admin.ModelAdmin):
    list_display = ("question_short", "status", "user", "tenant", "model_name", "total_tokens", "latency_ms", "created_at")
    list_filter = ("status", "model_name", "tenant")
    search_fields = ("question", "answer")
    readonly_fields = ("id", "created_at", "updated_at")
    date_hierarchy = "created_at"

    def question_short(self, obj):
        return obj.question[:60] + "..." if len(obj.question) > 60 else obj.question
    question_short.short_description = "Question"
