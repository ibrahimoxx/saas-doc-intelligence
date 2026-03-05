"""
DocPilot AI — Conversations API Views
"""

import logging
import time

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction, ConversationStatus, MessageRole
from apps.core.permissions import IsTenantMember
from apps.conversations.api.serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    CreateConversationSerializer,
    SendMessageSerializer,
)
from apps.conversations.models import Conversation, Message, MessageCitation
from apps.retrieval.infrastructure.rag_pipeline import ask_question
from apps.retrieval.infrastructure.vector_search import search_chunks

logger = logging.getLogger("apps.conversations")


class ConversationListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/conversations/        — List conversations
    POST /api/v1/tenants/{tenant_id}/conversations/        — Create + first message
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        """List user's conversations for this tenant."""
        qs = Conversation.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            status=ConversationStatus.ACTIVE,
        ).prefetch_related("messages")

        serializer = ConversationListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, tenant_id):
        """Create a new conversation with a first message + RAG response."""
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data.get("title", "")
        knowledge_space_id = serializer.validated_data.get("knowledge_space_id")
        first_message_content = serializer.validated_data["first_message"]

        # Auto-title from first message
        if not title:
            title = first_message_content[:80] + ("..." if len(first_message_content) > 80 else "")

        # Create conversation
        conversation = Conversation.objects.create(
            tenant_id=tenant_id,
            user=request.user,
            knowledge_space_id=knowledge_space_id,
            title=title,
        )

        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            role=MessageRole.USER,
            content=first_message_content,
        )

        # RAG: search + generate (wrapped so conversation is always returned)
        try:
            start_time = time.time()

            chunks = search_chunks(
                query=first_message_content,
                tenant_id=str(tenant_id),
                knowledge_space_id=str(knowledge_space_id) if knowledge_space_id else None,
            )

            result = ask_question(question=first_message_content, chunks=chunks)
            latency_ms = int((time.time() - start_time) * 1000)
        except Exception as e:
            logger.error(f"RAG pipeline error: {e}", exc_info=True)
            result = {
                "answer": f"Désolé, une erreur est survenue lors de la génération de la réponse. Détails : {str(e)[:200]}",
                "citations": [],
                "model": "error",
                "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
                "status": "error",
            }
            latency_ms = 0

        # Save assistant message
        assistant_msg = Message.objects.create(
            conversation=conversation,
            role=MessageRole.ASSISTANT,
            content=result["answer"],
            model_name=result["model"],
            prompt_tokens=result["tokens_used"]["prompt"],
            completion_tokens=result["tokens_used"]["completion"],
            total_tokens=result["tokens_used"]["total"],
            latency_ms=latency_ms,
        )

        # Save citations
        for citation in result["citations"]:
            MessageCitation.objects.create(
                message=assistant_msg,
                chunk_id=citation.get("chunk_id"),
                document_title=citation.get("document_title", ""),
                file_name=citation.get("file_name", ""),
                page_number=citation.get("page_number"),
                similarity=citation.get("similarity", 0),
                excerpt=citation.get("excerpt", ""),
            )

        # Audit
        log_action(
            AuditAction.QUESTION_ASKED,
            user=request.user, tenant_id=tenant_id,
            resource_type="conversation",
            resource_id=conversation.id,
            details={"question": first_message_content[:200], "chunks": len(chunks) if 'chunks' in dir() else 0},
            request=request,
        )

        return Response(
            ConversationDetailSerializer(conversation).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(APIView):
    """
    GET    /api/v1/tenants/{tenant_id}/conversations/{conversation_id}/
    DELETE /api/v1/tenants/{tenant_id}/conversations/{conversation_id}/
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id, conversation_id):
        """Get conversation with all messages + citations."""
        try:
            conversation = Conversation.objects.prefetch_related(
                "messages__citations"
            ).get(
                id=conversation_id,
                tenant_id=tenant_id,
                user=request.user,
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Conversation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(ConversationDetailSerializer(conversation).data)

    def delete(self, request, tenant_id, conversation_id):
        """Archive a conversation."""
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                tenant_id=tenant_id,
                user=request.user,
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Conversation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        conversation.status = ConversationStatus.ARCHIVED
        conversation.save(update_fields=["status", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)


class ConversationMessageView(APIView):
    """
    POST /api/v1/tenants/{tenant_id}/conversations/{conversation_id}/messages/

    Send a follow-up message → RAG response.
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def post(self, request, tenant_id, conversation_id):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                tenant_id=tenant_id,
                user=request.user,
                status=ConversationStatus.ACTIVE,
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Conversation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content = serializer.validated_data["content"]

        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            role=MessageRole.USER,
            content=content,
        )

        # RAG: search + generate (wrapped so response is always returned)
        try:
            start_time = time.time()
            space_id = conversation.knowledge_space_id

            chunks = search_chunks(
                query=content,
                tenant_id=str(tenant_id),
                knowledge_space_id=str(space_id) if space_id else None,
            )

            result = ask_question(question=content, chunks=chunks)
            latency_ms = int((time.time() - start_time) * 1000)
        except Exception as e:
            logger.error(f"RAG pipeline error: {e}", exc_info=True)
            chunks = []
            result = {
                "answer": f"Désolé, une erreur est survenue. Détails : {str(e)[:200]}",
                "citations": [],
                "model": "error",
                "tokens_used": {"prompt": 0, "completion": 0, "total": 0},
                "status": "error",
            }
            latency_ms = 0

        # Save assistant message
        assistant_msg = Message.objects.create(
            conversation=conversation,
            role=MessageRole.ASSISTANT,
            content=result["answer"],
            model_name=result["model"],
            prompt_tokens=result["tokens_used"]["prompt"],
            completion_tokens=result["tokens_used"]["completion"],
            total_tokens=result["tokens_used"]["total"],
            latency_ms=latency_ms,
        )

        # Save citations
        for citation in result["citations"]:
            MessageCitation.objects.create(
                message=assistant_msg,
                chunk_id=citation.get("chunk_id"),
                document_title=citation.get("document_title", ""),
                file_name=citation.get("file_name", ""),
                page_number=citation.get("page_number"),
                similarity=citation.get("similarity", 0),
                excerpt=citation.get("excerpt", ""),
            )

        # Update conversation timestamp
        conversation.save(update_fields=["updated_at"])

        # Audit
        log_action(
            AuditAction.QUESTION_ASKED,
            user=request.user, tenant_id=tenant_id,
            resource_type="conversation",
            resource_id=conversation.id,
            details={"question": content[:200], "chunks": len(chunks)},
            request=request,
        )

        # Return just the new messages
        from apps.conversations.api.serializers import MessageSerializer
        return Response({
            "user_message": MessageSerializer(user_msg).data,
            "assistant_message": MessageSerializer(assistant_msg).data,
        })
