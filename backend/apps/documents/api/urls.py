"""
DocPilot AI — Documents API URLs
"""

from django.urls import path

from apps.documents.api.views import (
    DocumentDetailView,
    DocumentsListView,
    DocumentStatusView,
)

urlpatterns = [
    path("", DocumentsListView.as_view(), name="documents-list"),
    path("<uuid:document_id>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<uuid:document_id>/status/", DocumentStatusView.as_view(), name="document-status"),
]
