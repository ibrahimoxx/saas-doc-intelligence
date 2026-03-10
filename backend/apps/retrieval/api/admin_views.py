"""
DocPilot AI — Admin Views

Endpoints restricted to superusers for platform-wide statistics and monitoring.
"""

from rest_framework import views, response, permissions
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.tenancy.models import Tenant
from apps.documents.models import Document
from apps.retrieval.models import QueryLog
from apps.conversations.models import Message
from apps.core.constants import MessageRole

User = get_user_model()


class IsSuperUser(permissions.BasePermission):
    """
    Allows access only to superusers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class AdminStatsView(views.APIView):
    """
    Retrieve platform-wide statistics.
    Available ONLY to superusers.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]

    def get(self, request, *args, **kwargs):
        # Calculate totals
        total_tenants = Tenant.objects.count()
        total_users = User.objects.count()
        total_documents = Document.objects.count()
        total_queries = QueryLog.objects.count() + Message.objects.filter(role=MessageRole.USER).count()

        # Calculate trends (last 7 days vs previous 7 days - simple version)
        now = timezone.now()
        seven_days_ago = now - timedelta(days=7)
        
        new_tenants_last_7d = Tenant.objects.filter(created_at__gte=seven_days_ago).count()
        new_users_last_7d = User.objects.filter(created_at__gte=seven_days_ago).count()
        new_documents_last_7d = Document.objects.filter(created_at__gte=seven_days_ago).count()
        queries_last_7d = (
            QueryLog.objects.filter(created_at__gte=seven_days_ago).count() +
            Message.objects.filter(role=MessageRole.USER, created_at__gte=seven_days_ago).count()
        )

        return response.Response({
            "totals": {
                "tenants": total_tenants,
                "users": total_users,
                "documents": total_documents,
                "queries": total_queries,
            },
            "recent_activity": {
                "new_tenants_7d": new_tenants_last_7d,
                "new_users_7d": new_users_last_7d,
                "new_documents_7d": new_documents_last_7d,
                "queries_7d": queries_last_7d,
            }
        })


class AdminRecentQueriesView(views.APIView):
    """
    Retrieve recent RAG queries across all tenants.
    Available ONLY to superusers.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]

    def get(self, request, *args, **kwargs):
        # Fetch the 20 most recent queries from QueryLog
        recent_queries = QueryLog.objects.select_related('user', 'tenant').order_by('-created_at')[:20]
        
        data = []
        for query in recent_queries:
            data.append({
                "id": str(query.id),
                "tenant_name": query.tenant.name if query.tenant else "Unknown",
                "user_email": query.user.email if query.user else "Anonymous",
                "question": query.question,
                "answer_preview": query.answer[:150] + "..." if len(query.answer) > 150 else query.answer,
                "model_used": query.model_used,
                "total_tokens": query.total_tokens,
                "created_at": query.created_at.isoformat(),
            })

        # Also fetch recent messages from the new Phase 7 conversations
        # We will fetch ASSISTANT messages to get token usage/model and pair them with the previous USER message conceptually,
        # but for simplicity we can just fetch USER messages and show the question.
        recent_messages = Message.objects.filter(role=MessageRole.USER).select_related('conversation__user', 'conversation__tenant').order_by('-created_at')[:20]
        
        for msg in recent_messages:
            data.append({
                "id": str(msg.id),
                "tenant_name": msg.conversation.tenant.name if msg.conversation.tenant else "Unknown",
                "user_email": msg.conversation.user.email if msg.conversation.user else "Anonymous",
                "question": msg.content,
                "answer_preview": "Voir la conversation pour la réponse complète.",
                "model_used": "N/A",  # The user message doesn't have the model, it's on the assistant message
                "total_tokens": 0,
                "created_at": msg.created_at.isoformat(),
            })
            
        # Sort combined data descending by created_at and limit back to 20
        data = sorted(data, key=lambda x: x["created_at"], reverse=True)[:20]

        return response.Response(data)
