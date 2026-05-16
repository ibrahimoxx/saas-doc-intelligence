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
from apps.core.permissions import IsTenantAdmin, IsTenantMember, get_user_tenant_role, user_can_access_space
from apps.tenancy.models import TenantMembership
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


def _get_role(request, tenant_id: str) -> str | None:
    return get_user_tenant_role(request.user, tenant_id)


def _member_user_ids(tenant_id: str) -> list:
    return list(
        TenantMembership.objects.filter(
            tenant_id=tenant_id, role="member", status="active"
        ).values_list("user_id", flat=True)
    )


def _accessible_qs(tenant_id: str, user, role: str | None):
    """Base queryset — always user-scoped for /chat endpoint."""
    return Conversation.objects.filter(
        tenant_id=tenant_id,
        user=user,
        hidden_for_user=False,
    )


class ConversationListView(APIView):
    """
    GET  /api/v1/tenants/{tenant_id}/conversations/        — List conversations
    POST /api/v1/tenants/{tenant_id}/conversations/        — Create + first message
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]

    def get(self, request, tenant_id):
        """List conversations — scope depends on role.

        owner: all tenant conversations.
        admin: own + all member conversations (traceability).
        manager/member: own non-hidden conversations only.
        """
        role = _get_role(request, tenant_id)
        qs = (
            _accessible_qs(tenant_id, request.user, role)
            .filter(status=ConversationStatus.ACTIVE)
            .select_related("user")
            .prefetch_related("messages")
        )
        serializer = ConversationListSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request, tenant_id):
        """Create a new conversation with a first message + RAG response."""
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data.get("title", "")
        knowledge_space_id = serializer.validated_data.get("knowledge_space_id")
        first_message_content = serializer.validated_data["first_message"]

        if knowledge_space_id and not user_can_access_space(request.user, tenant_id, knowledge_space_id):
            return Response(
                {"error": {"code": "forbidden", "message": "Accès à cet espace non autorisé."}},
                status=status.HTTP_403_FORBIDDEN,
            )

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
        """Get conversation with all messages + citations.

        Scope mirrors list: owner sees any, admin sees own + member, others see own.
        """
        role = _get_role(request, tenant_id)
        try:
            conversation = (
                _accessible_qs(tenant_id, request.user, role)
                .select_related("user")
                .prefetch_related("messages__citations")
                .get(id=conversation_id)
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Conversation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(ConversationDetailSerializer(conversation).data)

    def delete(self, request, tenant_id, conversation_id):
        """Delete a conversation — behaviour depends on role.

        owner: true archive (status=ARCHIVED, removed for everyone).
        admin: can only hide their own; member convos are read-only.
        member/manager: hides for themselves, admin/owner retain traceability.
        """
        role = _get_role(request, tenant_id)
        try:
            conversation = _accessible_qs(tenant_id, request.user, role).get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": {"code": "not_found", "message": "Conversation non trouvée."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if role == "owner":
            conversation.status = ConversationStatus.ARCHIVED
            conversation.save(update_fields=["status", "updated_at"])
        elif role == "admin" and str(conversation.user_id) != str(request.user.id):
            return Response(
                {"error": {"code": "forbidden", "message": "Les conversations membres sont en lecture seule pour les administrateurs."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        else:
            conversation.hidden_for_user = True
            conversation.save(update_fields=["hidden_for_user", "updated_at"])

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


class ConversationHistoryView(APIView):
    """
    GET /api/v1/tenants/{tenant_id}/conversations/history/

    Traceability endpoint — admin/owner only, read-only.
    Owner sees all roles. Admin sees members only.

    Query params:
      ?role=member|admin   further filter by role
      ?user_id=<uuid>      filter to a specific user
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get(self, request, tenant_id):
        role = _get_role(request, tenant_id)
        role_filter = request.query_params.get("role")
        user_id = request.query_params.get("user_id")

        if role == "owner":
            base_qs = Conversation.objects.filter(
                tenant_id=tenant_id, status=ConversationStatus.ACTIVE
            )
        else:
            member_ids = _member_user_ids(tenant_id)
            base_qs = Conversation.objects.filter(
                tenant_id=tenant_id,
                status=ConversationStatus.ACTIVE,
                user_id__in=member_ids,
            )

        if user_id:
            base_qs = base_qs.filter(user_id=user_id)
        elif role_filter:
            filtered_ids = list(
                TenantMembership.objects.filter(
                    tenant_id=tenant_id, role=role_filter, status="active"
                ).values_list("user_id", flat=True)
            )
            base_qs = base_qs.filter(user_id__in=filtered_ids)

        qs = base_qs.select_related("user").prefetch_related("messages")
        return Response(ConversationListSerializer(qs, many=True).data)
