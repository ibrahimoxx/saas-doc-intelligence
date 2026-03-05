"""
DocPilot AI — Conversations API Serializers
"""

from rest_framework import serializers

from apps.conversations.models import Conversation, Message, MessageCitation


class MessageCitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageCitation
        fields = ["id", "document_title", "file_name", "page_number", "similarity", "excerpt"]
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer):
    citations = MessageCitationSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ["id", "role", "content", "model_name", "total_tokens", "latency_ms", "citations", "created_at"]
        read_only_fields = fields


class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "title", "status", "knowledge_space_id", "message_count", "last_message", "created_at", "updated_at"]
        read_only_fields = fields

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return {"role": last.role, "content": last.content[:100], "created_at": last.created_at}
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "title", "status", "knowledge_space_id", "messages", "created_at", "updated_at"]
        read_only_fields = fields


class SendMessageSerializer(serializers.Serializer):
    """Validate a new message in a conversation."""
    content = serializers.CharField(max_length=2000, min_length=1)
    knowledge_space_id = serializers.UUIDField(required=False, allow_null=True)


class CreateConversationSerializer(serializers.Serializer):
    """Create a new conversation."""
    title = serializers.CharField(max_length=300, required=False, default="")
    knowledge_space_id = serializers.UUIDField(required=False, allow_null=True)
    first_message = serializers.CharField(max_length=2000, min_length=1)
