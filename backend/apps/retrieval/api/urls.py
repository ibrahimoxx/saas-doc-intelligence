"""
DocPilot AI — Retrieval API URLs
"""

from django.urls import path

from apps.retrieval.api.views import AskView

urlpatterns = [
    path("ask/", AskView.as_view(), name="chat-ask"),
]
