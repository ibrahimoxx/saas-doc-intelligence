from django.contrib import admin

from apps.conversations.models import Conversation, Message, MessageCitation


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("id", "role", "content", "model_name", "total_tokens", "latency_ms", "created_at")
    fields = ("role", "content", "model_name", "total_tokens", "latency_ms", "created_at")


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "tenant", "knowledge_space", "status", "message_count", "created_at")
    list_filter = ("status", "tenant")
    search_fields = ("title", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [MessageInline]

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = "Messages"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("role", "content_short", "conversation", "model_name", "total_tokens", "created_at")
    list_filter = ("role",)
    readonly_fields = ("id", "created_at", "updated_at")

    def content_short(self, obj):
        return obj.content[:80] + "..." if len(obj.content) > 80 else obj.content
    content_short.short_description = "Contenu"


@admin.register(MessageCitation)
class MessageCitationAdmin(admin.ModelAdmin):
    list_display = ("document_title", "page_number", "similarity", "message", "created_at")
    readonly_fields = ("id", "created_at", "updated_at")
