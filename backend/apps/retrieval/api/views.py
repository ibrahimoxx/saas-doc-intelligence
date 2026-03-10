"""
DocPilot AI — Retrieval API Views
"""

import logging
import time

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_observability.services import log_action
from apps.core.constants import AuditAction, QueryStatus
from apps.core.permissions import IsTenantMember
from apps.retrieval.api.serializers import AskQuestionSerializer
from apps.retrieval.infrastructure.rag_pipeline import ask_question
from apps.retrieval.infrastructure.vector_search import search_chunks
from apps.retrieval.models import QueryLog

logger = logging.getLogger("apps.retrieval")


class AskView(APIView):
    """
    POST /api/v1/tenants/{tenant_id}/chat/ask/

    Ask a question → vector search → RAG generation → citation response.
    """

    permission_classes = [permissions.IsAuthenticated, IsTenantMember]
    throttle_scope = "chat"

    def post(self, request, tenant_id):
        serializer = AskQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"]
        knowledge_space_id = serializer.validated_data.get("knowledge_space_id")

        start_time = time.time()

        # Step 1: Vector search
        chunks = search_chunks(
            query=question,
            tenant_id=str(tenant_id),
            knowledge_space_id=str(knowledge_space_id) if knowledge_space_id else None,
        )

        # Step 2: RAG generation
        result = ask_question(question=question, chunks=chunks)

        latency_ms = int((time.time() - start_time) * 1000)

        # Step 3: Log the query
        query_status = QueryStatus.OK
        if result["status"] == "no_answer":
            query_status = QueryStatus.NO_ANSWER
        elif result["status"] == "error":
            query_status = QueryStatus.ERROR

        QueryLog.objects.create(
            tenant_id=tenant_id,
            user=request.user,
            knowledge_space_id=knowledge_space_id,
            question=question,
            answer=result["answer"],
            status=query_status,
            chunks_used=len(chunks),
            model_name=result["model"],
            prompt_tokens=result["tokens_used"]["prompt"],
            completion_tokens=result["tokens_used"]["completion"],
            total_tokens=result["tokens_used"]["total"],
            latency_ms=latency_ms,
        )

        # Audit log
        log_action(
            AuditAction.QUESTION_ASKED,
            user=request.user,
            tenant_id=tenant_id,
            resource_type="query",
            details={
                "question": question[:200],
                "status": result["status"],
                "chunks_used": len(chunks),
                "latency_ms": latency_ms,
            },
            request=request,
        )

        logger.info(
            f"RAG query completed in {latency_ms}ms — "
            f"status={result['status']}, chunks={len(chunks)}"
        )

        return Response({
            "answer": result["answer"],
            "citations": result["citations"],
            "model": result["model"],
            "tokens_used": result["tokens_used"],
            "status": result["status"],
            "latency_ms": latency_ms,
        })
