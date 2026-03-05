"""
DocPilot AI — Retrieval API URLs
"""

from django.urls import path

from apps.retrieval.api.views import AskView
from apps.retrieval.api.admin_views import AdminStatsView, AdminRecentQueriesView

urlpatterns = [
    path("ask/", AskView.as_view(), name="chat-ask"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/queries/recent/", AdminRecentQueriesView.as_view(), name="admin-recent-queries"),
]
