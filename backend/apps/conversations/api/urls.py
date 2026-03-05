"""
DocPilot AI — Conversations API URLs
"""

from django.urls import path

from apps.conversations.api.views import (
    ConversationDetailView,
    ConversationListView,
    ConversationMessageView,
)

urlpatterns = [
    path("", ConversationListView.as_view(), name="conversation-list"),
    path("<uuid:conversation_id>/", ConversationDetailView.as_view(), name="conversation-detail"),
    path("<uuid:conversation_id>/messages/", ConversationMessageView.as_view(), name="conversation-messages"),
]
